import sqlite3
import pandas as pd
import requests
import datetime
import numpy as np

class FundManager:
    def __init__(self, db_name="funds.db"):
        self.db_name = db_name
        self._create_table()

    def _create_table(self):
        """Creates table and handles schema migration."""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        # 1. Create Core Tables
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS nav_history (
                scheme_code TEXT,
                date TEXT,
                nav REAL,
                PRIMARY KEY (scheme_code, date)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scheme_master (
                scheme_code TEXT PRIMARY KEY,
                scheme_name TEXT
            )
        """)
        
        # 2. Schema Migration: Add columns if they don't exist
        # We try to select the new columns. If it fails, we add them.
        try:
            cursor.execute("SELECT is_direct, is_growth, is_idcw FROM scheme_master LIMIT 1")
        except sqlite3.OperationalError:
            print("Migrating DB: Adding new columns to scheme_master...")
            try:
                cursor.execute("ALTER TABLE scheme_master ADD COLUMN is_direct INTEGER DEFAULT 0")
                cursor.execute("ALTER TABLE scheme_master ADD COLUMN is_growth INTEGER DEFAULT 0")
                cursor.execute("ALTER TABLE scheme_master ADD COLUMN is_idcw INTEGER DEFAULT 0")
                conn.commit()
            except sqlite3.OperationalError as e:
                # Columns might have completely partially existed or other issue
                print(f"Migration warning: {e}")

        conn.commit()
        conn.close()

    def fetch_and_update(self, scheme_code):
        """Fetches data from API and updates local DB incrementally."""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()

        cursor.execute("SELECT MAX(date) FROM nav_history WHERE scheme_code = ?", (scheme_code,))
        result = cursor.fetchone()
        last_date = result[0] if result else None
        
        url = f"https://api.mfapi.in/mf/{scheme_code}"
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException:
            conn.close()
            return

        if not data.get('data'):
            conn.close()
            return
            
        api_data = data['data']
        df = pd.DataFrame(api_data)
        df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y')
        df['nav'] = pd.to_numeric(df['nav'])
        df['scheme_code'] = str(scheme_code)
        df['date_str'] = df['date'].dt.strftime('%Y-%m-%d')

        if last_date:
            new_records = df[df['date_str'] > last_date]
        else:
            new_records = df

        if not new_records.empty:
            records_to_insert = new_records[['scheme_code', 'date_str', 'nav']].rename(columns={'date_str': 'date'})
            try:
                records_to_insert.to_sql('nav_history', conn, if_exists='append', index=False)
            except sqlite3.Error as e:
                print(f"Database Error: {e}")
        
        conn.close()

    def get_clean_data(self, scheme_code):
        """Returns daily-frequency DataFrame with Forward Fill."""
        conn = sqlite3.connect(self.db_name)
        query = "SELECT date, nav FROM nav_history WHERE scheme_code = ? ORDER BY date"
        df = pd.read_sql_query(query, conn, params=(scheme_code,))
        conn.close()

        if df.empty:
            return pd.DataFrame()

        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)

        full_range = pd.date_range(start=df.index.min(), end=df.index.max(), freq='D')
        clean_df = df.reindex(full_range)
        clean_df['nav'] = clean_df['nav'].ffill()
        
        clean_df.reset_index(inplace=True)
        clean_df.rename(columns={'index': 'date'}, inplace=True)
        
        return clean_df

    def search_funds(self, keyword, filter_type=None):
        """
        Searches funds by keyword.
        filter_type: 'Direct Growth', 'Regular', or None
        """
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()

        # 1. Populate Master if empty or unpopulated (migration case)
        cursor.execute("SELECT COUNT(*) FROM scheme_master")
        count = cursor.fetchone()[0]
        
        # Check if we have flags populated (if count > 0)
        need_refresh = False
        if count > 0:
            cursor.execute("SELECT SUM(is_direct + is_growth + is_idcw) FROM scheme_master")
            flag_sum = cursor.fetchone()[0]
            if flag_sum == 0 or flag_sum is None:
                print("Detected unpopulated flags (migration). Refreshing master list...")
                cursor.execute("DELETE FROM scheme_master")
                conn.commit()
                need_refresh = True
        
        if count == 0 or need_refresh:
            print("Downloading Master List...")
            try:
                resp = requests.get("https://api.mfapi.in/mf")
                resp.raise_for_status()
                all_funds = resp.json()
                
                data_to_insert = []
                for f in all_funds:
                    code = f['schemeCode']
                    name = f['schemeName']
                    
                    # Parsing Logic
                    is_direct = 1 if "Direct" in name else 0
                    is_growth = 1 if "Growth" in name else 0
                    is_idcw = 1 if "IDCW" in name or "Dividend" in name else 0
                    
                    data_to_insert.append((code, name, is_direct, is_growth, is_idcw))

                cursor.executemany("""
                    INSERT INTO scheme_master (scheme_code, scheme_name, is_direct, is_growth, is_idcw) 
                    VALUES (?, ?, ?, ?, ?)
                """, data_to_insert)
                conn.commit()
            except Exception as e:
                print(f"Error downloading master: {e}")
                conn.close()
                return []

        # 2. Build Query
        query = "SELECT scheme_code, scheme_name, is_direct, is_growth FROM scheme_master WHERE scheme_name LIKE ?"
        params = [f'%{keyword}%']

        if filter_type == "Direct Growth":
            query += " AND is_direct=1 AND is_growth=1"
        elif filter_type == "Regular":
            query += " AND is_direct=0"

        # 3. Sort: Direct Growth first
        query += " ORDER BY is_direct DESC, is_growth DESC, scheme_name ASC"

        cursor.execute(query, params)
        results = [{'code': row[0], 'name': row[1]} for row in cursor.fetchall()]
        conn.close()
        return results

    def get_rolling_return_stats(self, scheme_codes, years=3.0, benchmark_rate=0.06):
        """
        Calculates stats and probabilities for a list of funds.
        benchmark_rate: Annualized return to compare against (default 0.06 for 6%).
        """
        stats_output = {}

        for code in scheme_codes:
            # A. Fetch & Update
            print(f"Processing {code}...")
            self.fetch_and_update(code)
            
            # B. Clean Data
            df = self.get_clean_data(code)
            if df.empty:
                continue

            # C. Calc Rolling Returns
            days = int(years * 365)
            if len(df) < days:
                print(f"Skipping {code}: Insufficient data.")
                continue

            df['rolling_return'] = (df['nav'] / df['nav'].shift(days)) ** (1/years) - 1
            df.dropna(subset=['rolling_return'], inplace=True)

            if df.empty:
                continue

            # D. Compute Statistics
            rr = df['rolling_return']
            metrics = {
                "mean": float(rr.mean()),
                "max": float(rr.max()),
                "min": float(rr.min()),
                "median": float(rr.median()),
                "std_dev": float(rr.std())
            }

            # E. Compute Probabilities
            total_observations = len(rr)
            prob_loss = len(rr[rr < 0]) / total_observations
            prob_beat_benchmark = len(rr[rr > benchmark_rate]) / total_observations
            prob_beat_12pct = len(rr[rr > 0.12]) / total_observations

            probabilities = {
                "negative": prob_loss,
                "beat_benchmark": prob_beat_benchmark,
                "beat_12pct": prob_beat_12pct
            }

            # Prepare Series Data (Last 100 points for chart preview, or full if needed)
            # User example showed formatted date strings. 
            # Let's keep it lightweight for now, maybe last 365 days?
            # Creating a list of dicts as requested
            series_data = df.tail(100)[['date', 'nav', 'rolling_return']].copy()
            series_data['date'] = series_data['date'].dt.strftime('%Y-%m-%d')
            series_list = series_data.to_dict('records')

            # Fetch Name
            conn = sqlite3.connect(self.db_name)
            cursor = conn.cursor()
            cursor.execute("SELECT scheme_name FROM scheme_master WHERE scheme_code = ?", (code,))
            res = cursor.fetchone()
            name = res[0] if res else str(code)
            conn.close()

            stats_output[code] = {
                "name": name,
                "benchmark_used": benchmark_rate,
                "metrics": metrics,
                "probabilities": probabilities,
                "series_data": series_list
            }

        return stats_output

if __name__ == "__main__":
    fm = FundManager()
    
    # 1. Smart Search
    print("--- Searching 'Quant Small' (Direct Growth) ---")
    results = fm.search_funds("Quant Small", filter_type="Direct Growth")
    for r in results[:3]:
        print(f"[{r['code']}] {r['name']}")
    
    if not results:
        print("No results found.")
        target_codes = ["122639"] # Default to PPFAS
    else:
        # Pick top result + maybe 122639 for comparison
        target_codes = [results[0]['code'], "122639"]

    # 2. Analyze
    print(f"\n--- Analyzing Funds: {target_codes} ---")
    stats = fm.get_rolling_return_stats(target_codes, years=3)

    for code, data in stats.items():
        m = data['metrics']
        p = data['probabilities']
        print(f"\nFUND: {data['name']}")
        print(f"  Mean Return: {m['mean']:.2%}")
        print(f"  Volatility:  {m['std_dev']:.2%}")
        print(f"  Prob > 6%:   {p['beat_6pct']:.0%}")
        print(f"  Prob > 12%:  {p['beat_12pct']:.0%}")
        print(f"  Prob Loss:   {p['negative']:.0%}")

 "use client";

import { useEffect, useState } from "react";
import { auth, googleProvider, signInWithPopup, signOutUser, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, getDocs, query, orderBy, addDoc, serverTimestamp
} from "firebase/firestore";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [investors, setInvestors] = useState([]);
  const [income, setIncome] = useState("");
  const [rate, setRate] = useState("20");
  const [message, setMessage] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const login = async () => {
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { setMessage(e.message); }
  };

  const loadInvestors = async () => {
    try {
      const snap = await getDocs(query(collection(db, "investors"), orderBy("createdAt", "desc")));
      setInvestors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setMessage("Investor data পড়তে সমস্যা: " + e.message);
    }
  };

  const recordIncome = async () => {
    if (!income || !rate || !user) return;
    const total = Number(income);
    const pct = Number(rate);
    const pool = total * pct / 100;
    try {
      await addDoc(collection(db, "incomeRuns"), {
        totalIncome: total,
        returnRate: pct,
        investorPool: pool,
        createdBy: user.email,
        createdAt: serverTimestamp()
      });
      setMessage(`Income run saved. Investor pool: ৳${pool.toLocaleString("en-US")}`);
    } catch (e) {
      setMessage("Save failed: " + e.message);
    }
  };

  const isAdmin = user && ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!user) return (
    <main className="container">
      <section className="card center">
        <h1>🔐 Admin Panel</h1>
        <p>Admin Gmail দিয়ে প্রবেশ করুন।</p>
        <button onClick={login}>Google Login</button>
        {message && <p className="notice">{message}</p>}
      </section>
    </main>
  );

  if (!isAdmin) return (
    <main className="container">
      <section className="card center">
        <h1>Access denied</h1>
        <p>এই Gmail-এর Admin access নেই।</p>
        <button className="secondary" onClick={signOutUser}>Logout</button>
      </section>
    </main>
  );

  return (
    <main className="container">
      <header className="hero">
        <div><div className="brand">🌾 গ্রামসেবা</div><h1>Admin Panel</h1></div>
        <button className="secondary" onClick={() => signOutUser()}>Logout</button>
      </header>

      <section className="grid">
        <div className="card">
          <h2>🧮 Business Income</h2>
          <label>মোট ব্যবসার আয়</label>
          <input value={income} onChange={e => setIncome(e.target.value)} type="number" placeholder="100000" />
          <label>Investor return allocation (%)</label>
          <input value={rate} onChange={e => setRate(e.target.value)} type="number" min="0" max="100" />
          <p><b>Investor Pool:</b> ৳{(Number(income || 0) * Number(rate || 0) / 100).toLocaleString("en-US")}</p>
          <button onClick={recordIncome}>💾 Income Run Save</button>
        </div>

        <div className="card">
          <h2>👤 Investors</h2>
          <button onClick={loadInvestors}>↻ Load Investors</button>
          <div className="tableWrap">
            <table>
              <thead><tr><th>Email</th><th>Units</th><th>Investment</th></tr></thead>
              <tbody>
                {investors.map(x => (
                  <tr key={x.id}>
                    <td>{x.email || "-"}</td>
                    <td>{x.units || 0}</td>
                    <td>৳{Number(x.investment || 0).toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>📜 Transaction / Return History</h2>
        <p className="muted">
          এই starter version-এ income run ledger আছে। প্রকৃত wallet balance/return posting server-side transaction দিয়ে করা উচিত।
        </p>
        {message && <p className="notice">{message}</p>}
      </section>
    </main>
  );
}

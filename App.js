import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = { 
  apiKey: "AIzaSyDMLaqX1UF79jjiUO-OPvQvDzYgU0WbRco",
  authDomain: "final-project-d153d.firebaseapp.com",
  storageBucket: "final-project-d153d.firebasestorage.app",
  messagingSenderId: "859737187223",
  appId: "1:859737187223:web:69a47f075cea954cc55ad2",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const getToday = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [user, setUser] = useState(null);
  const [voted, setVoted] = useState(false);
  const [vote, setVote] = useState(null);
  const [stats, setStats] = useState({ yes: 0, no: 0, voters: [] });

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) checkVoteStatus(u.uid);
    });
  }, []);


  useEffect(() => {
    fetchVoteStats();
    const interval = setInterval(fetchVoteStats, 300000);
    return () => clearInterval(interval);
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    }
  };

  const checkVoteStatus = async (uid) => {
    const snap = await getDoc(doc(db, "votes", getToday()));
    const data = snap.data();
    if (snap.exists() && data[uid]) {
      setVoted(true);
      setVote(data[uid].vote);
    }
  };

  const castVote = async (choice) => {
    if (!user) return;
    const todayRef = doc(db, "votes", getToday());
    const snap = await getDoc(todayRef);
    const data = snap.data();

    if (snap.exists() && data[user.uid]) {
      alert("You already voted.");
      return;
    }

    await setDoc(
      todayRef,
      {
        [user.uid]: {
          name: user.displayName,
          vote: choice,
          timestamp: new Date().toISOString(),
        },
      },
      { merge: true }
    );

    setVoted(true);
    setVote(choice);
    fetchVoteStats();
  };

  const fetchVoteStats = async () => {
    const snap = await getDoc(doc(db, "votes", getToday()));
    if (snap.exists()) {
      const data = snap.data();
      const yes = Object.values(data).filter(v => v.vote === "yes").length;
      const no = Object.values(data).filter(v => v.vote === "no").length;
      const voters = Object.entries(data).map(([uid, info]) => ({ uid, ...info }));

      setStats({ yes, no, voters });
    }
  };

  return (
    <div className="p-6 font-sans text-center">
      <h1 className="text-3xl font-bold mb-4">Vote Now!</h1>

      {!user ? (
        <button onClick={signIn} className="bg-blue-500 text-white px-4 py-2 rounded">
          Sign in with Google
        </button>
      ) : (
        <div>
          <p className="mb-4">Hello, {user.displayName}!</p>

          {voted ? (
            <p className="text-green-600">You voted "{vote}" today ✅</p>
          ) : (
            <div>
              <p className="mb-2">Should we add hot chocolate machines to the school?</p>
              <button onClick={() => castVote("yes")} className="bg-green-500 text-white px-4 py-2 m-2 rounded">Yes</button>
              <button onClick={() => castVote("no")} className="bg-red-500 text-white px-4 py-2 m-2 rounded">No</button>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Live Vote Count</h2>
        <p>Yes: {stats.yes}</p>
        <p>No: {stats.no}</p>
      </div>

      {user?.email === "prakash_dhanvin@s2023.ssts.edu.sg" && (
        <div className="mt-6">
          <h3 className="text-lg font-bold">Voter List (Admin Only)</h3>
          <ul className="text-left max-w-md mx-auto">
            {stats.voters.map((v) => (
              <li key={v.uid}>
                🧑 {v.name}: {v.vote} ({new Date(v.timestamp).toLocaleTimeString()})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

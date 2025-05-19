
import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
const firebaseConfig = {apiKey: "YOUR_API_KEY", authDomain: "YOUR_PROJECT_ID.firebaseapp.com", projectId: "YOUR_PROJECT_ID", 
                        storageBucket: "YOUR_PROJECT_ID.appspot.com", messagingSenderId: "YOUR_SENDER_ID", appId: "YOUR_APP_ID"};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const getTodayDate = () => new Date().toISOString().slice(0, 10);
export default function App() {
  const [user, setUser] = useState(null);
  const [voted, setVoted] = useState(false);
  const [vote, setVote] = useState(null);
  const [voteStats, setVoteStats] = useState({ yes: 0, no: 0, voters: [] });
  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => 
      {
        setUser(currentUser);
        if (currentUser) checkIfVoted(currentUser.uid);
      }
    );
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVotes();
    }, 300000); // every 5 mins
    fetchVotes(); // initial fetch
    return () => clearInterval(interval);
  }, []);
  const signIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    }
  };
  const checkIfVoted = async (uid) => {
    const docRef = doc(db, "votes", getTodayDate());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data()[uid]) {
      setVoted(true);
      setVote(docSnap.data()[uid].vote);
    }
  };
  const castVote = async (choice) => {
    if (!user) return;
    const today = getTodayDate();
    const voteRef = doc(db, "votes", today);
    const docSnap = await getDoc(voteRef);
    if (docSnap.exists() && docSnap.data()[user.uid]) {
      alert("You already voted today!");
      return;
    }
    await setDoc(
      voteRef,
      {[user.uid]: 
        {
          name: user.displayName,
          vote: choice,
          timestamp: new Date().toISOString(),
        },
      }, { merge: true }
    );
    setVoted(true);
    setVote(choice);
    fetchVotes();
  };

  const fetchVotes = async () =>
    {
      const today = getTodayDate();
      const docRef = doc(db, "votes", today);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists())
      {
        const data = docSnap.data();
        const yes = Object.values(data).filter((v) => v.vote === "yes").length;
        const no = Object.values(data).filter((v) => v.vote === "no").length;
        setVoteStats({
          yes,
          no,
          voters: Object.entries(data).map(([uid, info]) => ({ uid, ...info })),
        });
    }
  };

  return (
    <div className="p-6 font-sans text-center">
      <h1 className="text-3xl font-bold mb-4">Vote Now!</h1>
      {!user ? (button onClick={signIn} className="bg-blue-500 text-white px-4 py-2 rounded"> Sign in with Google </button>):
        (<div>
          <p className="mb-4">Hello, {user.displayName}!</p>
          {voted ? (<p className="text-green-600">You voted "{vote}" today ✅</p>):(
            <div>
              <p className="mb-2">Should we add hot chocolate machines to the school?</p>
              <button onClick={() => castVote("yes")} className="bg-green-500 text-white px-4 py-2 m-2 rounded"> Yes </button>
              <button onClick={() => castVote("no")} className="bg-red-500 text-white px-4 py-2 m-2 rounded"> No </button>
            </div>)
        }
        </div>
      )}
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Live Vote Count</h2>
        <p>Yes: {voteStats.yes}</p>
        <p>No: {voteStats.no}</p>
      </div>
      {user?.email === "prakash_dhanvin@s2023.ssts.edu.sg" && (
        <div className="mt-6">
          <h3 className="text-lg font-bold">Voter List (Admin Only)</h3>
            <ul className="text-left max-w-md mx-auto">
              {voteStats.voters.map((v) => (
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

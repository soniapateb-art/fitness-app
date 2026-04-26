import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const adminEmail = "admin@email.com";

  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [exercises, setExercises] = useState([]);
  const [checkins, setCheckins] = useState([]);

  const [weight, setWeight] = useState("");
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState("");
  const [wins, setWins] = useState("");
  const [struggles, setStruggles] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        loadExercises(data.session.user.email);
        loadCheckins(data.session.user.email);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);

        if (currentSession) {
          loadExercises(currentSession.user.email);
          loadCheckins(currentSession.user.email);
        } else {
          setExercises([]);
          setCheckins([]);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const isAdmin = session?.user?.email === adminEmail;

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function loadExercises(userEmail) {
    let query = supabase
      .from("exercises")
      .select("*")
      .order("created_at", { ascending: false });

    if (userEmail !== adminEmail) {
      query = query.eq("client_email", userEmail);
    }

    const { data } = await query;
    setExercises(data || []);
  }

  async function loadCheckins(userEmail) {
    let query = supabase
      .from("checkins")
      .select("*")
      .order("created_at", { ascending: false });

    if (userEmail !== adminEmail) {
      query = query.eq("client_email", userEmail);
    }

    const { data } = await query;
    setCheckins(data || []);
  }

  async function submitCheckin() {
    const { error } = await supabase.from("checkins").insert([
      {
        client_email: session.user.email,
        weight,
        mood,
        energy,
        wins,
        struggles,
        notes,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setWeight("");
    setMood("");
    setEnergy("");
    setWins("");
    setStruggles("");
    setNotes("");

    loadCheckins(session.user.email);
  }

  async function deleteCheckin(id) {
    await supabase.from("checkins").delete().eq("id", id);
    loadCheckins(session.user.email);
  }

  if (!session) {
    return (
      <div style={{ padding: 40, background: "#111", color: "white", minHeight: "100vh" }}>
        <div style={{ maxWidth: 400, margin: "0 auto" }}>
          <img src="/logo.png.png" style={{ width: 180, display: "block", margin: "0 auto 20px" }} />
          <h1>Client Login</h1>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 12, marginBottom: 10 }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 12, marginBottom: 10 }}
          />

          <button onClick={login} style={{ width: "100%", padding: 12 }}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 30, background: "#111", color: "white", minHeight: "100vh", fontFamily: "Arial" }}>
      <div style={{ textAlign: "center" }}>
        <img src="/logo.png.png" style={{ width: 180 }} />
        <h1>{isAdmin ? "Coach Dashboard" : "My Training Plan"}</h1>
        <p>{session.user.email}</p>
        <button onClick={logout}>Logout</button>
      </div>

      <hr />

      <h2>Workouts</h2>

      {exercises.map((item) => (
        <div key={item.id} style={{ background: "#1e1e1e", padding: 20, borderRadius: 10, marginBottom: 20 }}>
          <h3>{item.title}</h3>
          <p>{item.notes}</p>

          <video
            src={item.video_url}
            controls
            style={{ width: "100%", maxWidth: 500, borderRadius: 10 }}
          />
        </div>
      ))}

      {!isAdmin && (
        <>
          <hr />

          <h2>Weekly Check-In</h2>

          <input placeholder="Weight" value={weight} onChange={(e) => setWeight(e.target.value)}
            style={{ width: "100%", padding: 12, marginBottom: 10 }} />

          <input placeholder="Mood /10" value={mood} onChange={(e) => setMood(e.target.value)}
            style={{ width: "100%", padding: 12, marginBottom: 10 }} />

          <input placeholder="Energy /10" value={energy} onChange={(e) => setEnergy(e.target.value)}
            style={{ width: "100%", padding: 12, marginBottom: 10 }} />

          <textarea placeholder="Wins this week"
            value={wins}
            onChange={(e) => setWins(e.target.value)}
            style={{ width: "100%", padding: 12, marginBottom: 10 }} />

          <textarea placeholder="Struggles"
            value={struggles}
            onChange={(e) => setStruggles(e.target.value)}
            style={{ width: "100%", padding: 12, marginBottom: 10 }} />

          <textarea placeholder="Extra notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: "100%", padding: 12, marginBottom: 10 }} />

          <button onClick={submitCheckin}>Submit Check-In</button>
        </>
      )}

      <hr />

      <h2>{isAdmin ? "Client Check-Ins" : "My Check-Ins"}</h2>

      {checkins.map((item) => (
        <div key={item.id} style={{ background: "#1e1e1e", padding: 20, borderRadius: 10, marginBottom: 20 }}>
          <p><b>Client:</b> {item.client_email}</p>
          <p><b>Weight:</b> {item.weight}</p>
          <p><b>Mood:</b> {item.mood}</p>
          <p><b>Energy:</b> {item.energy}</p>
          <p><b>Wins:</b> {item.wins}</p>
          <p><b>Struggles:</b> {item.struggles}</p>
          <p><b>Notes:</b> {item.notes}</p>

          {isAdmin && (
            <button
              onClick={() => deleteCheckin(item.id)}
              style={{ background: "red", color: "white" }}
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
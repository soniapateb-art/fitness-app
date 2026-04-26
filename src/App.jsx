import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [clientEmail, setClientEmail] = useState("");
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [exercises, setExercises] = useState([]);

  const adminEmail = "admin@email.com";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadExercises(data.session.user.email);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadExercises(session.user.email);
      else setExercises([]);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const isAdmin = session?.user?.email === adminEmail;

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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

    const { data, error } = await query;
    if (error) return alert(error.message);
    setExercises(data || []);
  }

  async function addExercise() {
    if (!clientEmail || !title || !videoUrl) {
      alert("Please add client email, exercise title and video URL");
      return;
    }

    const { error } = await supabase.from("exercises").insert([
      {
        client_email: clientEmail,
        title,
        video_url: videoUrl,
        notes,
      },
    ]);

    if (error) return alert(error.message);

    setTitle("");
    setVideoUrl("");
    setNotes("");
    loadExercises(session.user.email);
  }

  async function deleteExercise(id) {
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (error) return alert(error.message);
    loadExercises(session.user.email);
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #050505, #161616)",
      color: "white",
      fontFamily: "Arial",
      padding: 20,
    },
    container: {
      maxWidth: 1000,
      margin: "0 auto",
    },
    card: {
      background: "#111",
      border: "1px solid #2a2a2a",
      borderRadius: 18,
      padding: 20,
      marginBottom: 20,
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    },
    input: {
      width: "100%",
      padding: 14,
      marginBottom: 12,
      borderRadius: 12,
      border: "1px solid #333",
      background: "#0b0b0b",
      color: "white",
      fontSize: 15,
    },
    button: {
      padding: 14,
      borderRadius: 12,
      border: "none",
      background: "white",
      color: "black",
      fontWeight: "bold",
      cursor: "pointer",
    },
    danger: {
      padding: 12,
      borderRadius: 12,
      border: "none",
      background: "#ff3b3b",
      color: "white",
      fontWeight: "bold",
      cursor: "pointer",
      marginTop: 12,
    },
  };

  if (!session) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.container, maxWidth: 450 }}>
          <div style={{ ...styles.card, textAlign: "center", marginTop: 60 }}>
            <img src="/logo.png.png" style={{ width: 180, marginBottom: 20 }} />
            <h1>Client Login</h1>
            <p style={{ color: "#aaa" }}>Access your private training plan</p>

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />

            <button onClick={login} style={{ ...styles.button, width: "100%" }}>
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: "center" }}>
          <img src="/logo.png.png" style={{ width: 180, marginBottom: 10 }} />
          <h1>{isAdmin ? "Coach Dashboard" : "My Training Plan"}</h1>
          <p style={{ color: "#aaa" }}>
            Logged in as <b>{session.user.email}</b>
          </p>
          <button onClick={logout} style={styles.button}>
            Logout
          </button>
        </div>

        {isAdmin && (
          <div style={styles.card}>
            <h2>Add Exercise For Client</h2>

            <input
              placeholder="Client Email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              style={styles.input}
            />

            <input
              placeholder="Exercise Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
            />

            <input
              placeholder="Supabase Video URL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              style={styles.input}
            />

            <textarea
              placeholder="Workout notes, sets, reps, rest time..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...styles.input, height: 100 }}
            />

            <button onClick={addExercise} style={styles.button}>
              Add Exercise
            </button>
          </div>
        )}

        <h2 style={{ marginTop: 30 }}>
          {isAdmin ? "All Client Exercises" : "Your Exercises"}
        </h2>

        {exercises.length === 0 && (
          <div style={styles.card}>
            <p>No exercises yet.</p>
          </div>
        )}

        {exercises.map((item) => (
          <div key={item.id} style={styles.card}>
            <h2>{item.title}</h2>

            {isAdmin && (
              <p style={{ color: "#aaa" }}>
                Client: <b>{item.client_email}</b>
              </p>
            )}

            <video
              src={item.video_url}
              controls
              playsInline
              style={{
                width: "100%",
                maxHeight: 420,
                borderRadius: 16,
                background: "black",
                marginTop: 10,
              }}
            />

            <p style={{ lineHeight: 1.6, color: "#ddd" }}>{item.notes}</p>

            {isAdmin && (
              <button onClick={() => deleteExercise(item.id)} style={styles.danger}>
                Delete Exercise
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadExercises(data.session.user.email);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadExercises(session.user.email);
      else setExercises([]);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    const isAdmin = userEmail === "admin@email.com";

    let query = supabase.from("exercises").select("*").order("created_at", {
      ascending: false,
    });

    if (!isAdmin) {
      query = query.eq("client_email", userEmail);
    }

    const { data, error } = await query;

    if (!error) setExercises(data);
  }

  async function addExercise() {
    const { error } = await supabase.from("exercises").insert([
      {
        client_email: clientEmail,
        title,
        video_url: videoUrl,
        notes,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setTitle("");
    setVideoUrl("");
    setNotes("");
    loadExercises(session.user.email);
  }

  async function deleteExercise(id) {
    await supabase.from("exercises").delete().eq("id", id);
    loadExercises(session.user.email);
  }

  if (!session) {
    return (
      <div style={{ padding: 30, fontFamily: "Arial" }}>
        <h1>Fitness App Login</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, width: 320, marginBottom: 10 }}
        />

        <br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, width: 320, marginBottom: 10 }}
        />

        <br />

        <button onClick={login} style={{ padding: 10 }}>
          Login
        </button>

        <p style={{ marginTop: 20 }}>
          Use your Supabase user email + password
        </p>
      </div>
    );
  }

  const isAdmin = session.user.email === "admin@email.com";

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>My Fitness App</h1>

      <p>
        Logged in as: <b>{session.user.email}</b>
      </p>

      <button onClick={logout}>Logout</button>

      {isAdmin && (
        <>
          <hr />

          <h2>Add Exercise For Client</h2>

          <input
            placeholder="Client Email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            style={{ padding: 10, width: 320, marginBottom: 10 }}
          />

          <br />

          <input
            placeholder="Exercise Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: 10, width: 320, marginBottom: 10 }}
          />

          <br />

          <input
            placeholder="Google Drive /preview link"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            style={{ padding: 10, width: 320, marginBottom: 10 }}
          />

          <br />

          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ padding: 10, width: 320, height: 80, marginBottom: 10 }}
          />

          <br />

          <button onClick={addExercise} style={{ padding: 10 }}>
            Add Exercise
          </button>
        </>
      )}

      <hr />

      <h2>{isAdmin ? "All Client Exercises" : "My Exercises"}</h2>

      {exercises.map((item) => (
        <div
          key={item.id}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginBottom: 20,
            borderRadius: 8,
          }}
        >
          <h3>{item.title}</h3>
          <p>
            <b>Client:</b> {item.client_email}
          </p>
          <p>{item.notes}</p>

          <iframe
            src={item.video_url}
            width="300"
            height="200"
            allow="autoplay"
            allowFullScreen
            title={item.title}
          ></iframe>

          {isAdmin && (
            <>
              <br />
              <button
                onClick={() => deleteExercise(item.id)}
                style={{
                  padding: 10,
                  background: "red",
                  color: "white",
                  border: "none",
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
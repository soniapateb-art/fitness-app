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
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [restTime, setRestTime] = useState("");
  const [category, setCategory] = useState("");

  const [editingId, setEditingId] = useState(null);
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
    if (!error) setExercises(data || []);
  }

  function clearForm() {
    setClientEmail("");
    setTitle("");
    setVideoUrl("");
    setNotes("");
    setSets("");
    setReps("");
    setRestTime("");
    setCategory("");
    setEditingId(null);
  }

  async function addExercise() {
    if (!clientEmail || !title || !videoUrl) {
      alert("Please add client email, exercise title and video URL");
      return;
    }

    const exerciseData = {
      client_email: clientEmail,
      title,
      video_url: videoUrl,
      notes,
      sets,
      reps,
      rest_time: restTime,
      category,
    };

    let result;

    if (editingId) {
      result = await supabase
        .from("exercises")
        .update(exerciseData)
        .eq("id", editingId);
    } else {
      result = await supabase.from("exercises").insert([exerciseData]);
    }

    if (result.error) {
      alert(result.error.message);
      return;
    }

    clearForm();
    loadExercises(session.user.email);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setClientEmail(item.client_email || "");
    setTitle(item.title || "");
    setVideoUrl(item.video_url || "");
    setNotes(item.notes || "");
    setSets(item.sets || "");
    setReps(item.reps || "");
    setRestTime(item.rest_time || "");
    setCategory(item.category || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteExercise(id) {
    await supabase.from("exercises").delete().eq("id", id);
    loadExercises(session.user.email);
  }

  async function markComplete(id, current) {
    await supabase.from("exercises").update({ completed: !current }).eq("id", id);
    loadExercises(session.user.email);
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#111",
      color: "white",
      fontFamily: "Arial",
      padding: 30,
    },
    input: {
      display: "block",
      width: "100%",
      padding: 12,
      marginBottom: 10,
      borderRadius: 8,
      border: "1px solid #444",
      background: "#222",
      color: "white",
    },
    card: {
      background: "#1e1e1e",
      padding: 20,
      borderRadius: 12,
      marginBottom: 20,
    },
    button: {
      padding: 12,
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      marginRight: 8,
      marginTop: 8,
    },
  };

  if (!session) {
    return (
      <div style={styles.page}>
        <div style={{ maxWidth: 420, margin: "60px auto", textAlign: "center" }}>
          <img src="/logo.png.png" style={{ width: 180, marginBottom: 20 }} />
          <h1>Client Login</h1>

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
    );
  }

  return (
    <div style={styles.page}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <img src="/logo.png.png" style={{ width: 180 }} />
          <h1>{isAdmin ? "Coach Dashboard" : "My Training Plan"}</h1>
          <p>{session.user.email}</p>
          <button onClick={logout} style={styles.button}>Logout</button>
        </div>

        {isAdmin && (
          <div style={styles.card}>
            <h2>{editingId ? "Edit Exercise" : "Add Client Exercise"}</h2>

            <input placeholder="Client Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} style={styles.input} />
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} />
            <input placeholder="Video URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} style={styles.input} />
            <input placeholder="Sets" value={sets} onChange={(e) => setSets(e.target.value)} style={styles.input} />
            <input placeholder="Reps" value={reps} onChange={(e) => setReps(e.target.value)} style={styles.input} />
            <input placeholder="Rest Time" value={restTime} onChange={(e) => setRestTime(e.target.value)} style={styles.input} />
            <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} style={styles.input} />

            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...styles.input, height: 100 }}
            />

            <button onClick={addExercise} style={{ ...styles.button, background: "white", color: "black" }}>
              {editingId ? "Save Changes" : "Add Exercise"}
            </button>

            {editingId && (
              <button onClick={clearForm} style={{ ...styles.button, background: "#555", color: "white" }}>
                Cancel Edit
              </button>
            )}
          </div>
        )}

        <h2>{isAdmin ? "All Client Workouts" : "My Workouts"}</h2>

        {exercises.map((item) => (
          <div key={item.id} style={styles.card}>
            <h3>{item.title}</h3>
            {isAdmin && <p><b>Client:</b> {item.client_email}</p>}
            <p><b>Category:</b> {item.category}</p>
            <p><b>Sets:</b> {item.sets} | <b>Reps:</b> {item.reps}</p>
            <p><b>Rest:</b> {item.rest_time}</p>
            <p>{item.notes}</p>

            <video
              src={item.video_url}
              controls
              playsInline
              style={{ width: "100%", maxWidth: 500, borderRadius: 10 }}
            />

            <br />

            {!isAdmin && (
              <button onClick={() => markComplete(item.id, item.completed)} style={styles.button}>
                {item.completed ? "Completed ✅" : "Mark Complete"}
              </button>
            )}

            {isAdmin && (
              <>
                <button onClick={() => startEdit(item)} style={{ ...styles.button, background: "#f1c40f" }}>
                  Edit
                </button>

                <button onClick={() => deleteExercise(item.id)} style={{ ...styles.button, background: "red", color: "white" }}>
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
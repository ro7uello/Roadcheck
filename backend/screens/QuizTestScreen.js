import React, { useEffect, useState } from "react";
import { View, Text, Button, TouchableOpacity, StyleSheet } from "react-native";

export default function QuizTestScreen() {
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Fetch one scenario from backend
  useEffect(() => {
    fetch("http://localhost:5000/scenarios") // adjust to your backend URL
      .then(res => res.json())
      .then(data => {
        setQuestion(data[0]); // just grab the first scenario for testing
      })
      .catch(err => console.error(err));
  }, []);

  const submitAnswer = async () => {
    if (!selected) return;

    try {
      const token = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkhwV1hLUUsxd3E1SS9hTVUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2dxYmh4ZGhoYm1kaXlnZWppcmdxLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiYzRiZmI0Ny01NWZmLTQzNGItYjZiOC1kMTg4NDUxY2U0NTUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU3NDYxMDAzLCJpYXQiOjE3NTc0NTc0MDMsImVtYWlsIjoiamFucm93ZWxsYXJvdWVsbG9AZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImphbnJvd2VsbGFyb3VlbGxvQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImJjNGJmYjQ3LTU1ZmYtNDM0Yi1iNmI4LWQxODg0NTFjZTQ1NSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzU3NDU3NDAzfV0sInNlc3Npb25faWQiOiIyZDgxMmU0ZC1lZmIwLTQxZDAtYTA4NS1mNmEyMDE0ZmEyZmEiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.8HA4s1qgqon4HnBQnOkDQL0H6kw9VNIPHvinkhkLDms"; // from login
      const res = await fetch("http://localhost:5000/auth/attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          scenario_id: question.id,
          chosen_option: selected
        })
      });

      const result = await res.json();
      setFeedback(result);
    } catch (err) {
      console.error(err);
    }
  };

  if (!question) return <Text>Loading question...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{question.title}</Text>
      <Text style={styles.desc}>{question.description}</Text>

      {question.choices?.map(choice => (
        <TouchableOpacity
          key={choice.option}
          style={[
            styles.choice,
            selected === choice.option && styles.choiceSelected
          ]}
          onPress={() => setSelected(choice.option)}
        >
          <Text>{choice.option}. {choice.text}</Text>
        </TouchableOpacity>
      ))}

      <Button title="Submit" onPress={submitAnswer} />

      {feedback && (
        <View style={styles.feedback}>
          <Text>{feedback.data?.is_correct ? "✅ Correct!" : "❌ Wrong!"}</Text>
          <Text>{feedback.data?.explanation}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  desc: { fontSize: 16, marginBottom: 16 },
  choice: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 8
  },
  choiceSelected: {
    backgroundColor: "#e0f7fa",
    borderColor: "#26a69a"
  },
  feedback: { marginTop: 20 }
});

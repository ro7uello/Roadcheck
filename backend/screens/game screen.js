import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { supabase } from "../supabaseClient.js"; // adjust path to your supabase client

export default function GameScreen() {
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from("scenarios") // your table name
        .select("id, question, options, correct");

      if (error) {
        console.error("Error fetching questions:", error);
      } else {
        setQuestions(data);
      }
    };

    fetchQuestions();
  }, []);

  const handleAnswer = (answer) => {
    if (answer === questions[questionIndex].correct) {
      setScore(score + 1);
    }
    setQuestionIndex(questionIndex + 1);
  };

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Loading questions...</Text>
      </View>
    );
  }

  if (questionIndex >= questions.length) {
    return (
      <View style={styles.container}>
        <Text>Game Over! Your score: {score}</Text>
      </View>
    );
  }

  const currentQuestion = questions[questionIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{currentQuestion.question}</Text>
      {currentQuestion.options.map((option, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.option}
          onPress={() => handleAnswer(option)}
        >
          <Text>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  question: { fontSize: 18, marginBottom: 20 },
  option: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#eee",
    borderRadius: 5,
    width: "80%",
    alignItems: "center",
  },
});

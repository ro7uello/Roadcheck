// DatabaseContentViewer.jsx - Component to display scenarios and choices from database

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

const DatabaseContentViewer = () => {
  const [scenarios, setScenarios] = useState([]);
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatabaseContent();
  }, []);

  const fetchDatabaseContent = async () => {
    try {
      // Fetch scenarios 41-50
      const scenariosResponse = await fetch(`${API_BASE_URL}/scenarios?start_id=41&end_id=50`);
      const scenariosData = await scenariosResponse.json();

      // Fetch choices 118-150
      const choicesResponse = await fetch(`${API_BASE_URL}/scenario-choices?start_id=118&end_id=150`);
      const choicesData = await choicesResponse.json();

      setScenarios(scenariosData);
      setChoices(choicesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching database content:', error);
      setLoading(false);
    }
  };

  const getChoicesForScenario = (scenarioId) => {
    return choices.filter(choice => choice.scenario_id === scenarioId);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading database content...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Database Content Viewer</Text>
      <Text style={styles.subtitle}>Scenarios 41-50 & Choices 118-150</Text>

      {scenarios.map((scenario) => {
        const scenarioChoices = getChoicesForScenario(scenario.id);

        return (
          <View key={scenario.id} style={styles.scenarioCard}>
            <Text style={styles.scenarioTitle}>
              Scenario {scenario.id}: {scenario.title}
            </Text>

            <Text style={styles.scenarioDescription}>
              {scenario.description}
            </Text>

            <View style={styles.choicesContainer}>
              <Text style={styles.choicesTitle}>Answer Choices:</Text>

              {scenarioChoices.map((choice) => (
                <View
                  key={choice.id}
                  style={[
                    styles.choiceItem,
                    choice.is_correct && styles.correctChoice
                  ]}
                >
                  <Text style={styles.choiceOption}>
                    {choice.option}. {choice.text}
                  </Text>

                  {choice.is_correct && (
                    <Text style={styles.correctLabel}>✓ Correct Answer</Text>
                  )}

                  {choice.explanation && (
                    <Text style={styles.explanation}>
                      Explanation: {choice.explanation}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  scenarioCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scenarioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  scenarioDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 15,
    lineHeight: 20,
  },
  choicesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  choicesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  choiceItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  correctChoice: {
    backgroundColor: '#e8f5e8',
    borderLeftColor: '#4CAF50',
  },
  choiceOption: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  correctLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  explanation: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

export default DatabaseContentViewer;
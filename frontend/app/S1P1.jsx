import React, { useRef, useEffect, useState } from "react";
import { View, Image, Button, Animated, ActivityIndicator, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";

const { width, height } = Dimensions.get("window");

export default function DrivingGame() {
  const navigation = useNavigation();
  
  // Backend integration states
  const [scenarios, setScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [choices, setChoices] = useState([]); // Initialize as empty array
  
  // Responsive calculations
  const playerCarWidth = Math.min(width * 0.25, 280);
  const playerCarHeight = playerCarWidth * (350/280);
  const jeepWidth = Math.min(width * 0.28, 300);
  const jeepHeight = jeepWidth * (350/280);
  const npcCarWidth = Math.min(width * 0.24, 260);
  const npcCarHeight = npcCarWidth * (350/280);
  const overlayTop = height * 0.4;
  const overlayHeight = height * 0.35;
  const ltoWidth = Math.min(width * 0.3, 240);
  const ltoHeight = ltoWidth * (300/240);
  const sideMargin = width * 0.05;

  // Road tiles
  const roadTiles = {
    road2: require("../assets/road/road2.png"),
    road3: require("../assets/road/road3.png"),
    road5: require("../assets/road/road5.png"),
  };

  // Map layout
  const mapLayout = [
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
    ["road2", "road2", "road5", "road2", "road3"],
  ];

  // Sprite definitions
  const playerCarSprites = {
    NORTH: [
      require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
      require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
    ],
    NORTHWEST: [
      require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
      require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
    ],
    WEST: [
      require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
      require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
    ],
    NORTHEAST: [
      require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
      require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
    ],
    EAST: [
      require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
      require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
    ],
  };

  const jeepneySprites = {
    NORTH: [
      require("../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
      require("../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
    ],
  };

  const npcCarSprites = {
    NORTH: [
      require("../assets/car/SEDAN TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SEDAN_CLEAN_NORTH_000.png"),
      require("../assets/car/SEDAN TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SEDAN_CLEAN_NORTH_001.png"),
    ],
    SOUTH: [
      require("../assets/car/TAXI TOPDOWN/MOVE/SOUTH/SEPARATED/TAXI_CLEAN_SOUTH_000.png"),
      require("../assets/car/TAXI TOPDOWN/MOVE/SOUTH/SEPARATED/TAXI_CLEAN_SOUTH_001.png"),
    ]
  };

  // Fetch scenarios and choices from backend
  useEffect(() => {
    const fetchScenariosAndChoices = async () => {
      console.log("Starting fetchScenariosAndChoices...");
      
      try {
        const token = await AsyncStorage.getItem("access_token");
        console.log("Token retrieved:", token ? "Token exists" : "No token found");
        
        if (!token) {
          console.log("No token found, redirecting to login");
          Alert.alert("Authentication Error", "Please login first");
          navigation.navigate('Login');
          return;
        }

        // Fetch scenarios
        const scenariosUrl = `${API_URL}/scenarios`;
        console.log("Making request to:", scenariosUrl);

        const scenariosResponse = await fetch(scenariosUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log("Scenarios response status:", scenariosResponse.status);

        if (!scenariosResponse.ok) {
          const errorText = await scenariosResponse.text();
          console.log("Scenarios error response:", errorText);
          throw new Error(`HTTP error! status: ${scenariosResponse.status}`);
        }

        const scenariosData = await scenariosResponse.json();
        console.log("Scenarios loaded:", scenariosData.length);

        setScenarios(scenariosData);
        
        if (scenariosData.length > 0) {
          const firstScenario = scenariosData[0];
          setCurrentScenario(firstScenario);
          
          // Fetch choices for the first scenario
          await fetchChoicesForScenario(firstScenario.id, token);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        Alert.alert("Error", `Failed to load scenarios: ${error.message}`);
        setLoading(false);
      }
    };

    fetchScenariosAndChoices();
  }, []);

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [showIntro, setShowIntro] = useState(true);
  const [isPlayerCarVisible, setIsPlayerCarVisible] = useState(true);
  const [isJeepneyVisible, setIsJeepneyVisible] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;
  const currentScroll = useRef(0);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [playerCarDirection, setPlayerCarDirection] = useState("NORTH");
  const [playerCarFrame, setPlayerCarFrame] = useState(0);
  const [jeepneyFrame, setJeepneyFrame] = useState(0);
  const [npcCarFrames, setNpcCarFrames] = useState({});

  const playerCarXAnim = useRef(new Animated.Value(width / 2 - playerCarWidth / 2)).current;
  const jeepneyInitialX = 2 * tileSize + (tileSize / 2 - jeepWidth / 2);
  const jeepneyYAnim = useRef(new Animated.Value(-jeepHeight)).current;

  // NPC Car setup
  const npcCars = useRef([
    {
      id: 'npc1',
      direction: 'SOUTH',
      lane: 0,
      yAnim: new Animated.Value(-npcCarHeight),
      frame: 0,
    },
    {
      id: 'npc2',
      direction: 'NORTH',
      lane: 4,
      yAnim: new Animated.Value(height),
      frame: 0,
    },
    {
      id: 'npc3',
      direction: 'SOUTH',
      lane: 1,
      yAnim: new Animated.Value(-npcCarHeight * 2),
      frame: 0,
    },
    {
      id: 'npc4',
      direction: 'NORTH',
      lane: 3,
      yAnim: new Animated.Value(height + npcCarHeight),
      frame: 0,
    },
  ]).current;

  const startNpcCarAnimation = (npcCar) => {
    const { direction, yAnim } = npcCar;
    const isNorth = direction === 'NORTH';
    const startValue = isNorth ? height : -npcCarHeight;
    const endValue = isNorth ? -npcCarHeight : height;
    const duration = 7000 + Math.random() * 3000;

    yAnim.setValue(startValue + Math.random() * (height / 2));

    return Animated.loop(
      Animated.timing(yAnim, {
        toValue: endValue,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
  };

  const npcCarAnimationsRef = useRef([]);
  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const scrollAnimationRef = useRef(null);
  const jeepneyAnimationRef = useRef(null);

  // Helper function to fetch choices for a scenario
  const fetchChoicesForScenario = async (scenarioId, token) => {
    try {
      const choicesUrl = `${API_URL}/scenario_choices/${scenarioId}`;
      console.log("Making request for choices to:", choicesUrl);

      const choicesResponse = await fetch(choicesUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Choices response status:", choicesResponse.status);

      if (!choicesResponse.ok) {
        const errorText = await choicesResponse.text();
        console.log("Choices error response:", errorText);
        throw new Error(`HTTP error! status: ${choicesResponse.status}`);
      }

      const choicesData = await choicesResponse.json();
      console.log("Choices loaded:", choicesData);
      setChoices(choicesData);
    } catch (error) {
      console.error("Error fetching choices:", error);
      // If choices endpoint doesn't exist, try alternative endpoint
      try {
        const alternativeUrl = `${API_URL}/scenarios/${scenarioId}/choices`;
        console.log("Trying alternative choices endpoint:", alternativeUrl);
        
        const altResponse = await fetch(alternativeUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (altResponse.ok) {
          const altChoicesData = await altResponse.json();
          console.log("Alternative choices loaded:", altChoicesData);
          setChoices(altChoicesData);
        } else {
          console.log("Alternative endpoint also failed");
          setChoices([]);
        }
      } catch (altError) {
        console.error("Alternative endpoint error:", altError);
        setChoices([]);
      }
    }
  };

  // Animation effects
  useEffect(() => {
    if (!showIntro) {
      npcCarAnimationsRef.current = npcCars.map(car => {
        const animation = startNpcCarAnimation(car);
        animation.start();
        return animation;
      });

      const npcSpriteInterval = setInterval(() => {
        setNpcCarFrames(prevFrames => {
          const newFrames = {};
          npcCars.forEach(car => {
            newFrames[car.id] = (prevFrames[car.id] === 0 ? 1 : 0);
          });
          return newFrames;
        });
      }, 250);

      return () => {
        npcCarAnimationsRef.current.forEach(anim => anim.stop());
        clearInterval(npcSpriteInterval);
      };
    }
  }, [showIntro, npcCars]);

  useEffect(() => {
    if (!showQuestion && isPlayerCarVisible) {
      const interval = setInterval(() => {
        setPlayerCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isPlayerCarVisible]);

  useEffect(() => {
    if (!showQuestion && isJeepneyVisible) {
      const interval = setInterval(() => {
        setJeepneyFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isJeepneyVisible]);

  function startScrollAnimation() {
    scrollY.setValue(0);
    jeepneyYAnim.setValue(-jeepHeight);

    npcCarAnimationsRef.current.forEach(anim => anim.stop());
    npcCarAnimationsRef.current = npcCars.map(car => {
      const animation = startNpcCarAnimation(car);
      animation.start();
      return animation;
    });

    scrollAnimationRef.current = Animated.loop(
      Animated.timing(scrollY, {
        toValue: -mapHeight,
        duration: mapHeight * 10,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    scrollAnimationRef.current.start();

    jeepneyAnimationRef.current = Animated.timing(jeepneyYAnim, {
      toValue: -height * 0.2,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    jeepneyAnimationRef.current.start(() => {
      setTimeout(() => {
        if (scrollAnimationRef.current) {
          scrollAnimationRef.current.stop();
        }
        npcCarAnimationsRef.current.forEach(anim => anim.stop());

        setIsPlayerCarVisible(true);
        setIsJeepneyVisible(true);
        setPlayerCarFrame(0);
        setJeepneyFrame(0);

        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 2000);
    });
  }

  useEffect(() => {
    if (!showIntro) {
      startScrollAnimation();
    }
    return () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
        jeepneyAnimationRef.current.stop();
      }
      npcCarAnimationsRef.current.forEach(anim => anim.stop());
    };
  }, [showIntro]);

  // Submit answer to backend
  const submitAnswerToBackend = async (chosenOption) => {
    try {
      setSubmitting(true);
      
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        console.error("No token found!");
        return null;
      }

      const body = {
        scenario_id: currentScenario.id,
        selected_option: chosenOption,
      };

      console.log("=== FRONTEND DEBUG ===");
      console.log("Current scenario:", currentScenario);
      console.log("Chosen option:", chosenOption);
      console.log("Body to send:", body);
      console.log("API URL:", `${API_URL}/attempts`);
      console.log("Token:", token);
      console.log("===================");

      const res = await fetch(`${API_URL}/attempts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      console.log("Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.log("Error response:", errorText);
        throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log("Submit success:", data);
      
      setSubmitting(false);
      return { data };
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitting(false);
      return null;
    }
  };

  // FIXED: Updated handleFeedback function
  const handleFeedback = (result) => {
    if (!result || !result.data) return;

    const isCorrect = result.data.is_correct;
    
    // Use the explanation from backend response
    const explanation = isCorrect 
      ? result.data.explanation?.selected || result.data.explanation?.correct || "Correct!"
      : result.data.explanation?.selected || "Wrong answer!";

    // Show the explanation directly
    const message = explanation;
    
    setFeedback(message);
    setAnimationType(isCorrect ? "correct" : "wrong");
    setIsCorrectAnswer(isCorrect);
    
    if (isCorrect) {
      Animated.timing(correctAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        correctAnim.setValue(0);
        setShowNext(true);
      });
    } else {
      Animated.timing(wrongAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        wrongAnim.setValue(0);
        setShowNext(true);
      });
    }
  };

  // New animation functions
  const animateProceed = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    npcCarAnimationsRef.current.forEach(anim => anim.stop());

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    // Move car forward quickly
    await new Promise(resolve => {
      setPlayerCarDirection("NORTH");
      Animated.timing(scrollY, {
        toValue: scrollY._value - (tileSize * 2),
        duration: 1000,
        easing: Easing.easeOut,
        useNativeDriver: true,
      }).start(resolve);
    });

    // Restart animations
    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    npcCarAnimationsRef.current = npcCars.map(car => {
      const animation = startNpcCarAnimation(car);
      animation.start();
      return animation;
    });
  };

  const animateStop = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    npcCarAnimationsRef.current.forEach(anim => anim.stop());

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    // Simulate sudden stop (car bounces slightly)
    await new Promise(resolve => {
      Animated.sequence([
        Animated.timing(scrollY, {
          toValue: scrollY._value + 10,
          duration: 200,
          easing: Easing.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: scrollY._value,
          duration: 300,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ]).start(resolve);
    });

    // Keep animations stopped to show the "stop" effect
    setTimeout(() => {
      if (scrollAnimationRef.current) scrollAnimationRef.current.start();
      npcCarAnimationsRef.current = npcCars.map(car => {
        const animation = startNpcCarAnimation(car);
        animation.start();
        return animation;
      });
    }, 1500);
  };

  const animateOvertake = async (targetX) => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    npcCarAnimationsRef.current.forEach(anim => anim.stop());

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    await new Promise(resolve => {
      setPlayerCarDirection("NORTHWEST");
      Animated.parallel([
        Animated.timing(playerCarXAnim, {
          toValue: targetX,
          duration: 300,
          easing: Easing.easeOut,
          useNativeDriver: false,
        }),
        Animated.timing(scrollY, {
          toValue: scrollY._value - (tileSize * 0.5),
          duration: 300,
          easing: Easing.easeOut,
          useNativeDriver: true,
        })
      ]).start(resolve);
    });

    await new Promise(resolve => {
      setPlayerCarDirection("NORTH");
      Animated.parallel([
        Animated.timing(jeepneyYAnim, {
          toValue: height + jeepHeight,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: scrollY._value - (tileSize * 3),
          duration: 1000,
          easing: Easing.easeOut,
          useNativeDriver: true,
        }),
      ]).start(resolve);
    });
    setIsJeepneyVisible(false);

    await new Promise(resolve => {
      setPlayerCarDirection("NORTHEAST");
      Animated.parallel([
        Animated.timing(playerCarXAnim, {
          toValue: width / 2 - playerCarWidth / 2,
          duration: 400,
          easing: Easing.easeOut,
          useNativeDriver: false,
        }),
        Animated.timing(scrollY, {
          toValue: scrollY._value - (tileSize * 0.5),
          duration: 400,
          easing: Easing.easeOut,
          useNativeDriver: true,
        })
      ]).start(resolve);
    });

    setPlayerCarDirection("NORTH");

    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    npcCarAnimationsRef.current = npcCars.map(car => {
      const animation = startNpcCarAnimation(car);
      animation.start();
      return animation;
    });
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(false);
  };

  // FIXED: Updated handleAnswer function with choice-based animations
  const handleAnswer = async (chosenOption) => {
    setSelectedAnswer(chosenOption);
    setShowQuestion(false);
    setShowAnswers(false);

    // Submit to backend and get result
    const result = await submitAnswerToBackend(chosenOption);

    if (result) {
      // Find the selected choice to check its text content
      const selectedChoice = choices.find(
        choice => choice.option === chosenOption
      );

      if (result.data.is_correct) {
        // Correct answer → immediate feedback
        handleFeedback(result);
      } else {
        // Wrong answer → check choice type for specific animations
        const choiceText = selectedChoice?.text.toLowerCase() || '';
        
        if (choiceText.includes("overtake")) {
          console.log("Playing overtaking animation");
          // Wait for animation to finish before feedback
          const targetX = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);
          await animateOvertake(targetX);
          handleFeedback(result);
        } else if (choiceText.includes("honk")) {
          console.log("Playing honking animation");
          // Delay before feedback
          setTimeout(() => handleFeedback(result), 1000);
        } else if (choiceText.includes("proceed straight") || choiceText.includes("proceed") || choiceText.includes("continue")) {
          console.log("Playing proceed animation");
          // Animate car moving forward
          await animateProceed();
          handleFeedback(result);
        } else if (choiceText.includes("stop")) {
          console.log("Playing stop animation");
          // Animate sudden stop
          await animateStop();
          handleFeedback(result);
        } else {
          // Default wrong feedback for other choices
          handleFeedback(result);
        }
      }
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setFeedback(null);
    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    const centerX = width / 2 - playerCarWidth / 2;
    playerCarXAnim.setValue(centerX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    if (scenarioIndex < scenarios.length - 1) {
      const nextIndex = scenarioIndex + 1;
      setScenarioIndex(nextIndex);
      const nextScenario = scenarios[nextIndex];
      setCurrentScenario(nextScenario);
      
      // Fetch choices for next scenario
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (token) {
          await fetchChoicesForScenario(nextScenario.id, token);
        }
      } catch (error) {
        console.error("Error fetching next scenario choices:", error);
        setChoices([]);
      }
      
      startScrollAnimation();
    } else {
      navigation.navigate('S2P1');
      setShowQuestion(false);
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
        jeepneyAnimationRef.current.stop();
      }
      npcCarAnimationsRef.current.forEach(anim => anim.stop());
    }
  };

  const handleStartGame = () => {
    setShowIntro(false);
  };

  // Show loading screen while fetching scenarios
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#26a69a" />
        <Text style={styles.loadingText}>Loading scenarios...</Text>
      </View>
    );
  }

  // Show error if no scenarios loaded
  if (!currentScenario) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No scenarios available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setLoading(true)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const feedbackMessage = feedback || "";

  if (showIntro) {
    return (
      <View style={styles.introContainer}>
        <Image
          source={require("../assets/dialog/LTO.png")}
          style={styles.introLTOImage}
        />
        <View style={styles.introTextBox}>
          <Text style={styles.introTitle}>Welcome to ROADCHECK!</Text>
          <Text style={styles.introText}>
            Test your knowledge of road rules and signs.
            Choose the correct option to proceed safely.
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black", overflow: 'hidden' }}>
      {/* Map - Looping background */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: mapHeight * 2,
          left: 0,
          transform: [{
            translateY: scrollY.interpolate({
              inputRange: [-mapHeight, 0],
              outputRange: [0, -mapHeight],
              extrapolate: 'clamp',
            })
          }],
          zIndex: 1,
        }}
      >
        {[0, 1].map((multiplier) => (
          mapLayout.map((row, rowIndex) => (
            <React.Fragment key={`${rowIndex}-${multiplier}`}>
              {row.map((tile, colIndex) => (
                <Image
                  key={`${rowIndex}-${colIndex}-${multiplier}`}
                  source={roadTiles[tile]}
                  style={{
                    position: "absolute",
                    width: tileSize,
                    height: tileSize,
                    left: colIndex * tileSize,
                    top: rowIndex * tileSize + (multiplier * mapHeight),
                  }}
                  resizeMode="stretch"
                />
              ))}
            </React.Fragment>
          ))
        ))}
      </Animated.View>

      {/* Responsive Jeepney */}
      {isJeepneyVisible && (
        <Animated.Image
          source={jeepneySprites.NORTH[jeepneyFrame]}
          style={{
            width: jeepWidth,
            height: jeepHeight,
            position: "absolute",
            left: jeepneyInitialX,
            transform: [{ translateY: jeepneyYAnim }],
            zIndex: 4,
          }}
        />
      )}

      {/* NPC Cars */}
      {npcCars.map(car => {
        const xPos = car.lane * tileSize + (tileSize / 2 - npcCarWidth / 2);
        const sourceSprites = npcCarSprites[car.direction];
        const currentFrame = npcCarFrames[car.id] || 0;
        const spriteSource = sourceSprites && sourceSprites[currentFrame] ? sourceSprites[currentFrame] : null;

        if (!spriteSource) return null;

        return (
          <Animated.Image
            key={car.id}
            source={spriteSource}
            style={{
              width: npcCarWidth,
              height: npcCarHeight,
              position: "absolute",
              left: xPos,
              transform: [{ translateY: car.yAnim }],
              zIndex: 3,
            }}
          />
        );
      })}

      {/* Responsive Player Car */}
      {isPlayerCarVisible && (
        <Animated.Image
          source={playerCarSprites[playerCarDirection][playerCarFrame]}
          style={{
            width: playerCarWidth,
            height: playerCarHeight,
            position: "absolute",
            bottom: height * 0.1,
            left: playerCarXAnim,
            zIndex: 5,
          }}
        />
      )}

      {/* Question Overlay - Now using backend data */}
      {showQuestion && currentScenario && (
        <View style={styles.questionOverlay}>
          <Image source={require("../assets/dialog/LTO.png")}
            style={styles.ltoImage}
          />
          <View style={styles.questionBox}>
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionText}>
                {currentScenario.description}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Answers - Fixed to use choices array properly */}
      {showAnswers && Array.isArray(choices) && choices.length > 0 && (
        <View style={styles.answersContainer}>
            {choices.map((choice) => (
                <TouchableOpacity
                    key={choice.option}
                    style={[styles.answerButton, submitting && styles.answerButtonDisabled]}
                    onPress={() => !submitting && handleAnswer(choice.option)}
                    disabled={submitting}
                >
                    <Text style={styles.answerText}>
                        {choice.option}. {choice.text}
                    </Text>
                    {submitting && selectedAnswer === choice.option && (
                        <ActivityIndicator size="small" color="#fff" style={styles.answerLoader} />
                    )}
                </TouchableOpacity>
            ))}
        </View>
      )}

      {/* Feedback - Now using backend data */}
      {(animationType === "correct" || animationType === "wrong") && feedback && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Next Button */}
      {showNext && (
        <View style={styles.nextButtonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Loading and error styles
  loadingContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  
  // Intro styles (responsive)
  introContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    padding: width * 0.05,
  },
  introLTOImage: {
    width: width * 0.6,
    height: height * 0.25,
    resizeMode: "contain",
    marginBottom: height * 0.03,
  },
  introTextBox: {
    backgroundColor: "rgba(8, 8, 8, 0.7)",
    padding: width * 0.06,
    borderRadius: 15,
    alignItems: "center",
    maxWidth: width * 0.85,
    minHeight: height * 0.3,
    justifyContent: "center",
  },
  introTitle: {
    color: "white",
    fontSize: Math.min(width * 0.07, 32),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: height * 0.02,
  },
  introText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    textAlign: "center",
    marginBottom: height * 0.04,
    lineHeight: Math.min(width * 0.06, 26),
    paddingHorizontal: width * 0.02,
  },
  startButton: {
    backgroundColor: "#007bff",
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.08,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    minWidth: width * 0.4,
    alignItems: "center",
  },
  startButtonText: {
    color: "white",
    fontSize: Math.min(width * 0.055, 24),
    fontWeight: "bold",
  },

  // In-game responsive styles
  questionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: height * 0.35,
    backgroundColor: "rgba(8, 8, 8, 0.43)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: height * 0.01,
    zIndex: 10,
  },
  ltoImage: {
    width: Math.min(width * 0.3, 240),
    height: Math.min(width * 0.3, 240) * (300/240),
    resizeMode: "contain",
    marginLeft: -width * 0.03,
    marginBottom: -height * 0.09,
  },
  questionBox: {
    flex: 1,
    bottom: height * 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  questionTextContainer: {
    padding: -height * 0.04,
    maxWidth: width * 0.6,
  },
  questionText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 28),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.4,
    right: width * 0.05,
    width: width * 0.35,
    height: height * 0.21,
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.015,
    borderRadius: 8,
    marginBottom: height * 0.015,
    borderWidth: 1,
    borderColor: "#555",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  answerButtonDisabled: {
    opacity: 0.7,
  },
  answerText: {
    color: "white",
    fontSize: Math.min(width * 0.04, 18),
    textAlign: "center",
    flex: 1,
  },
  answerLoader: {
    marginLeft: 8,
  },
  feedbackOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: height * 0.35,
    backgroundColor: "rgba(8, 8, 8, 0.43)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: height * 0.01,
    zIndex: 10,
  },
  feedbackBox: {
    flex: 1,
    bottom: height * 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackText: {
    color: "white",
    fontSize: Math.min(width * 0.06, 28),
    fontWeight: "bold",
  },
  nextButtonContainer: {
    position: "absolute",
    top: height * 0.50,
    right: width * 0.05,
    width: width * 0.2,
    alignItems: "center",
    zIndex: 11,
  },
  nextButton: {
    backgroundColor: "#007bff",
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.06,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: width * 0.15,
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
  },
});
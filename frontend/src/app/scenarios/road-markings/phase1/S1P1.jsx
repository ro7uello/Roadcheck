// frontend/src/app/scenarios/road-markings/phase1/S1P1.jsx
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  Easing,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

const { width, height } = Dimensions.get("window");

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
  road2: require("../../../../../assets/road/road2.png"),
  road3: require("../../../../../assets/road/road3.png"),
  road5: require("../../../../../assets/road/road5.png"),
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

// Vehicle sprites (same as your original)
const playerCarSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHWEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
  WEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
  ],
  NORTHEAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
};

const jeepneySprites = {
  NORTH: [
    require("../../../../../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
};

const npcCarSprites = {
  NORTH: [
    require("../../../../../assets/car/SEDAN TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SEDAN_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/SEDAN TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SEDAN_CLEAN_NORTH_001.png"),
  ],
  SOUTH: [
    require("../../../../../assets/car/TAXI TOPDOWN/MOVE/SOUTH/SEPARATED/TAXI_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/TAXI TOPDOWN/MOVE/SOUTH/SEPARATED/TAXI_CLEAN_SOUTH_001.png"),
  ]
};

// FALLBACK QUESTIONS - ONLY USED IF DATABASE FAILS
const fallbackQuestions = [
  {
    question: "You're driving on a major national highway and encounter a single solid yellow line on your side with a broken line on the opposite side. You want to overtake a slow jeepney.",
    options: [" Don't overtake at all", "Overtake immediately since there's only one solid line", "Wait for a safe opportunity, then overtake if the opposite lane is clear"],
    correct: " Don't overtake at all",
    wrongExplanation: {
      "Overtake immediately since there's only one solid line": "Violation! The solid line on your side means you cannot overtake, regardless of what's on the opposite side.",
      "Wait for a safe opportunity, then overtake if the opposite lane is clear": "Violation! Even if the opposite lane is clear, the solid line on your side prohibits overtaking."
    }
  },
];

export default function S1P1() {
  const navigation = useNavigation();

  // DATABASE STATE - REPLACES HARDCODED QUESTIONS
  const [questions, setQuestions] = useState(fallbackQuestions); // Start with fallback, replace with DB data
  const [loading, setLoading] = useState(true);

  // Database functions
 const fetchQuestionsFromDatabase = async () => {
  try {
    setLoading(true);
    console.log('Fetching from:', API_URL);
    
    // Get auth token
    const token = await AsyncStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // These endpoints need to match your backend routes
    const scenarioResponse = await fetch(`${API_URL}/scenarios/1`, { headers });
    const choicesResponse = await fetch(`${API_URL}/scenario_choices/1`, { headers }); // Note: different endpoint name
    
    console.log('Scenario response:', scenarioResponse.status);
    console.log('Choices response:', choicesResponse.status);
    
    if (scenarioResponse.ok && choicesResponse.ok) {
      const scenarioData = await scenarioResponse.json();
      const choicesData = await choicesResponse.json();
      
      console.log('Scenario data:', scenarioData);
      console.log('Choices data:', choicesData);
      
      const correctChoice = choicesData.find(choice => choice.is_correct);
      
      const dbQuestions = [{
        question: scenarioData.description || scenarioData.title,
        options: choicesData.map(choice => choice.text),
        correct: correctChoice?.text || "",
        correctExplanation: correctChoice?.explanation || "", // Add this
        wrongExplanation: choicesData.reduce((acc, choice) => {
          if (!choice.is_correct) {
            acc[choice.text] = choice.explanation; // This uses database explanation
          }
          return acc;
        }, {})
      }];
      
      setQuestions(dbQuestions);
      console.log('Database questions loaded successfully');
    } else {
      console.log('Database fetch failed, using fallback questions');
    }
  } catch (error) {
    console.log('Database error, using fallback questions:', error);
  } finally {
    setLoading(false);
  }
};

  const recordAttempt = async (selectedChoice, isCorrect) => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) return;

    const payload = {
      user_id: 1,
      scenario_id: 1,
      selected_option: selectedChoice, // Changed from selected_choice to selected_option
      is_correct: isCorrect,
      attempt_time: new Date().toISOString(),
    };

    console.log('Sending to backend:', payload); // Add this debug log

    await fetch(`${API_URL}/attempts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    console.log('Attempt recorded:', selectedChoice, isCorrect);
  } catch (err) {
    console.log('Failed to record attempt:', err);
  }
};

  const updateProgress = async (isCompleted = false) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      await fetch(`${API_URL}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 1,
          category_id: 2,
          phase_id: 1,
          scenario_id: 1,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        }),
      });
      console.log('Progress updated:', isCompleted);
    } catch (err) {
      console.log('Failed to update progress:', err);
    }
  };

  // Fetch database questions on component mount
  useEffect(() => {
    fetchQuestionsFromDatabase();
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

  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);
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

  // NPC Cars setup (same as original)
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

  // Function to start a single NPC car animation loop
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

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Animation for player's car sprite
  useEffect(() => {
    if (!showQuestion && isPlayerCarVisible) {
      const interval = setInterval(() => {
        setPlayerCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isPlayerCarVisible]);

  // Animation for jeepney's sprite
  useEffect(() => {
    if (!showQuestion && isJeepneyVisible) {
      const interval = setInterval(() => {
        setJeepneyFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isJeepneyVisible]);

  const scrollAnimationRef = useRef(null);
  const jeepneyAnimationRef = useRef(null);

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

  const handleFeedback = async (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    const isCorrect = answerGiven === currentQuestion.correct;
    
    setIsCorrectAnswer(isCorrect);

    await recordAttempt(answerGiven, isCorrect);
    if (isCorrect) {
      await updateProgress(true);
    }
    
    if (isCorrect) {
    await updateProgress(true);
  }

  if (isCorrect) {
      setAnimationType("correct");
      Animated.timing(correctAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        correctAnim.setValue(0);
        setShowNext(true);
      });
    } else {
      setAnimationType("wrong");
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

  const animateOvertake = async (targetX) => {
  return new Promise(async (resolve) => {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
      npcCarAnimationsRef.current.forEach(anim => anim.stop());

      setPlayerCarFrame(0);
      setJeepneyFrame(0);

      // Step 1: Move to overtake lane
      await new Promise(resolveStep => {
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
        ]).start(resolveStep);
      });

      // Step 2: Overtake
      await new Promise(resolveStep => {
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
        ]).start(resolveStep);
      });

      setIsJeepneyVisible(false);

      // Step 3: Return to lane
      await new Promise(resolveStep => {
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
        ]).start(resolveStep);
      });

      setPlayerCarDirection("NORTH");

      // Restart animations
      if (scrollAnimationRef.current) scrollAnimationRef.current.start();
      npcCarAnimationsRef.current = npcCars.map(car => {
        const animation = startNpcCarAnimation(car);
        animation.start();
        return animation;
      });
      setIsPlayerCarVisible(true);
      setIsJeepneyVisible(false);
      
      resolve();
    });
  };

  const animateForwardMovement = async () => {
  return new Promise(async (resolve) => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    npcCarAnimationsRef.current.forEach(anim => anim.stop());

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    await new Promise(resolveStep => {
      Animated.timing(scrollY, {
        toValue: scrollY._value - (tileSize * 2),
        duration: 1500,
        easing: Easing.easeOut,
        useNativeDriver: true,
      }).start(resolveStep);
    });

    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    npcCarAnimationsRef.current = npcCars.map(car => {
      const animation = startNpcCarAnimation(car);
      animation.start();
      return animation;
    });
    
    resolve();
  });
};

// 2. Then your handleAnswer function (make sure it ends with a closing brace)
const handleAnswer = (answer) => {
  console.log('Answer selected:', answer);
  setSelectedAnswer(answer);
  setShowQuestion(false);
  setShowAnswers(false);

  if (scrollAnimationRef.current) {
    scrollAnimationRef.current.start();
  }
  npcCarAnimationsRef.current = npcCars.map(car => {
    const animation = startNpcCarAnimation(car);
    animation.start();
    return animation;
  });

  setIsPlayerCarVisible(true);
  setIsJeepneyVisible(true);

  const currentQuestion = questions[questionIndex];
  const isCorrect = answer === currentQuestion.correct;

  if (isCorrect) {
    handleFeedback(answer);
  } else {
    const answerLower = answer.toLowerCase();
    
    if (answerLower.includes('move forward') || answerLower.includes('slowly') || answerLower.includes('ahead')) {
      animateForwardMovement().then(() => {
        handleFeedback(answer);
      });
    } else if (answerLower.includes('overtake') && answerLower.includes('immediately')) {
      const targetX = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);
      animateOvertake(targetX).then(() => {
        handleFeedback(answer);
      });
    } else if (answerLower.includes('overtake') && (answerLower.includes('wait') || answerLower.includes('safe'))) {
      setTimeout(() => {
        const targetX = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);
        animateOvertake(targetX).then(() => {
          handleFeedback(answer);
        });
      }, 3000);
    } else {
      handleFeedback(answer);
    }
  }
};

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    const centerX = width / 2 - playerCarWidth / 2;
    playerCarXAnim.setValue(centerX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
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

 const currentQuestionData = questions[questionIndex];
const feedbackMessage = isCorrectAnswer
  ? "Correct! " + (currentQuestionData.correctExplanation || "You chose the right answer!")
  : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer selected.";

if (loading) {
  return (
    <View style={{ flex: 1, backgroundColor: "black", justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 18 }}>Loading scenario...</Text>
    </View>
  );
}

  if (showIntro) {
    return (
      <View style={styles.introContainer}>
        <Image
          source={require("../../../../../assets/dialog/LTO.png")}
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

      {/* Question Overlay - NOW USES DATABASE DATA */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image
            source={require("../../../../../assets/dialog/LTO.png")}
            style={styles.ltoImage}
          />
          <View style={styles.questionBox}>
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionText}>
                {currentQuestionData.question}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Answer Choices - NOW USES DATABASE DATA */}
      {showAnswers && (
        <View style={styles.answersContainer}>
          {currentQuestionData.options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.answerButton}
              onPress={() => handleAnswer(option)}
            >
              <Text style={styles.answerText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Responsive Feedback - Correct/Wrong */}
      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Responsive Next Button */}
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

// Your existing styles (same as original)
const styles = StyleSheet.create({
  // Copy all your existing styles here - they remain unchanged
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
  questionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: overlayHeight,
    backgroundColor: "rgba(8, 8, 8, 0.43)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: height * 0.01,
    zIndex: 10,
  },
  ltoImage: {
    width: ltoWidth,
    height: ltoHeight,
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
    right: sideMargin,
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
  },
  answerText: {
    color: "white",
    fontSize: Math.min(width * 0.04, 18),
    textAlign: "center",
  },
  feedbackOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: overlayHeight,
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
    right: sideMargin,
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
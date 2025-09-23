import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  Easing
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";

// Debug API_URL at module level
console.log('S1P1 Module loaded. API_URL from env:', API_URL);

const { width, height } = Dimensions.get("window");

// Fallback questions - keep your original questions as backup
const fallbackQuestions = [
  {
    question: "You're driving on a highway and see a single solid yellow lines in the center. Traffic is heavy, and you notice a faster-moving lane to your left.",
    options: ["Stay in your current lane", "Overtake by crossing the solid yellow lines to reach the faster lane", "Honk for a long time to make the cars move faster."],
    correct: "Stay in your current lane",
    wrongExplanation: {
      "Overtake by crossing the solid yellow lines to reach the faster lane": "Violation. Solid yellow lane means overtaking is not allowed. You can only make a left turn to another street or an establishment.",
      "Honk for a long time to make the cars move faster.": "Road rage prone! In a situation where the area is experiencing traffic, honking a lot can only make other drivers mad and wouldn't make the cars move faster."
    }
  },
];

export default function DrivingGame() {
  const navigation = useNavigation();

  // ✅ DATABASE INTEGRATION - Using proven pattern from S6P1-S10P1
  const [questions, setQuestions] = useState(fallbackQuestions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Responsive calculations - FIXED: Better proportions
  const playerCarWidth = Math.min(width * 0.22, 250);
  const playerCarHeight = playerCarWidth * (350/280);
  const jeepWidth = Math.min(width * 0.25, 270);
  const jeepHeight = jeepWidth * (350/280);
  const npcCarWidth = Math.min(width * 0.21, 230);
  const npcCarHeight = npcCarWidth * (350/280);
  const overlayTop = height * 0.4;
  const overlayHeight = height * 0.45; // FIXED: Increased height to prevent overflow
  const ltoWidth = Math.min(width * 0.25, 200); // FIXED: Reduced LTO size
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
  ];

  // Sprite definitions
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

  // ✅ DATABASE INTEGRATION - Added this useEffect to fetch data
  useEffect(() => {
    const fetchScenarioData = async () => {
      try {
        console.log('S1P1: Fetching scenario data...');
        console.log('S1P1: API_URL value:', API_URL);

        const token = await AsyncStorage.getItem('access_token');
        console.log('S1P1: Token retrieved:', token ? 'Yes' : 'No');

        const url = `${API_URL}/scenarios/1`;
        console.log('S1P1: Fetching from URL:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('S1P1: Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('S1P1: Data received:', data);

        if (data && data.scenario) {
          // Transform database response to match your frontend format
          const transformedQuestion = {
            question: data.scenario.question_text,
            options: data.choices.map(choice => choice.choice_text),
            correct: data.choices.find(choice => choice.choice_id === data.scenario.correct_choice_id)?.choice_text,
            wrongExplanation: {}
          };

          // Build wrong explanations
          data.choices.forEach(choice => {
            if (choice.choice_id !== data.scenario.correct_choice_id && choice.explanation) {
              transformedQuestion.wrongExplanation[choice.choice_text] = choice.explanation;
            }
          });

          setQuestions([transformedQuestion]);
          console.log('S1P1: ✅ Database questions loaded successfully');
        } else {
          console.log('S1P1: ⚠️ Invalid data structure, using fallback');
          setQuestions(fallbackQuestions);
        }
      } catch (error) {
        console.log('S1P1: ❌ Database error, using fallback questions:', error.message);
        setQuestions(fallbackQuestions);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarioData();
  }, []);

  // ✅ DATABASE INTEGRATION - Added updateProgress function
  const updateProgress = async (scenarioId, selectedOption, isCorrect) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userId = await AsyncStorage.getItem('user_id');

      if (!token || !userId) {
        console.log('S1P1: No token or user_id found for progress update');
        return;
      }

      // Record the attempt
      const attemptResponse = await fetch(`${API_URL}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          scenario_id: scenarioId,
          selected_option: selectedOption,
          is_correct: isCorrect,
          completed_at: new Date().toISOString()
        })
      });

      if (attemptResponse.ok) {
        console.log('S1P1: ✅ Progress updated successfully');
      } else {
        console.log('S1P1: ⚠️ Failed to update progress:', attemptResponse.status);
      }
    } catch (error) {
      console.log('S1P1: ❌ Error updating progress:', error.message);
    }
  };

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
    // initialize currentScroll
    currentScroll.current = 0;
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

  // FIXED: NPC Car setup with better collision detection
  const npcCars = useRef([
    {
      id: 'npc1',
      direction: 'SOUTH',
      lane: 0,
      yAnim: new Animated.Value(-npcCarHeight * 2),
      frame: 0,
    },
    {
      id: 'npc2',
      direction: 'NORTH',
      lane: 4,
      yAnim: new Animated.Value(height + npcCarHeight),
      frame: 0,
    },
    {
      id: 'npc3',
      direction: 'SOUTH',
      lane: 1,
      yAnim: new Animated.Value(-npcCarHeight * 4),
      frame: 0,
    },
    {
      id: 'npc4',
      direction: 'NORTH',
      lane: 3,
      yAnim: new Animated.Value(height + npcCarHeight * 2),
      frame: 0,
    },
  ]).current;

  const startNpcCarAnimation = (npcCar) => {
    const { direction, yAnim } = npcCar;
    const isNorth = direction === 'NORTH';
    const startValue = isNorth ? height + npcCarHeight : -npcCarHeight * 2;
    const endValue = isNorth ? -npcCarHeight * 2 : height + npcCarHeight;
    const duration = 8000 + Math.random() * 4000; // FIXED: Slower, more varied speeds

    yAnim.setValue(startValue);

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

  // Animation effects - ALL PRESERVED
  useEffect(() => {
    if (!showIntro) {
      // start NPC loops
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
    // reset scroll and jeepney positions
    scrollY.setValue(0);
    currentScroll.current = 0;
    jeepneyYAnim.setValue(-jeepHeight);

    // stop and restart npc animations for fresh spacing
    npcCarAnimationsRef.current.forEach(anim => anim.stop());
    npcCarAnimationsRef.current = npcCars.map(car => {
      const animation = startNpcCarAnimation(car);
      animation.start();
      return animation;
    });

    scrollAnimationRef.current = Animated.loop(
      Animated.timing(scrollY, {
        toValue: -mapHeight,
        duration: mapHeight * 12, // FIXED: Slightly slower for better visibility
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

  // ✅ DATABASE INTEGRATION - Modified useEffect to wait for data
  useEffect(() => {
    if (!showIntro && !loading) {
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
  }, [showIntro, loading]); // Added loading dependency

  // Updated handleFeedback function
  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    const isCorrect = answerGiven === currentQuestion.correct;

    // ✅ DATABASE INTEGRATION - Update progress when feedback is shown
    updateProgress(1, answerGiven, isCorrect); // scenario_id = 1 for S1P1

    if (isCorrect) {
      setIsCorrectAnswer(true);
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
      setIsCorrectAnswer(false);
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

  // Animation functions - FIXED: Better collision handling (use currentScroll.current)
  const animateProceed = async () => {
    console.log("🚗 Playing proceed animation");
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    npcCarAnimationsRef.current.forEach(anim => anim.stop());

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    // use currentScroll.current instead of _value
    const offset = currentScroll.current || 0;

    await new Promise(resolve => {
      setPlayerCarDirection("NORTH");
      Animated.timing(scrollY, {
        toValue: offset - (tileSize * 2),
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        // update currentScroll to new value
        currentScroll.current = offset - (tileSize * 2);
        resolve();
      });
    });

    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    npcCarAnimationsRef.current = npcCars.map(car => {
      const animation = startNpcCarAnimation(car);
      animation.start();
      return animation;
    });
  };

  const animateStop = async () => {
    console.log("🛑 Playing stop animation");
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    npcCarAnimationsRef.current.forEach(anim => anim.stop());

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    const offset = currentScroll.current || 0;

    await new Promise(resolve => {
      Animated.sequence([
        Animated.timing(scrollY, {
          toValue: offset + 10,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: offset,
          duration: 300,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // currentScroll remains offset
        currentScroll.current = offset;
        resolve();
      });
    });

    setTimeout(() => {
      if (scrollAnimationRef.current) scrollAnimationRef.current.start();
      npcCarAnimationsRef.current = npcCars.map(car => {
        const animation = startNpcCarAnimation(car);
        animation.start();
        return animation;
      });
    }, 1500);
  };

  // FIXED: Overtake animation with proper collision avoidance
  // UPDATED: Animate multiple left-side NPCs (not just the first one)
  const animateOvertake = async (targetX) => {
    console.log("🚗💨 Playing overtake animation (safe flow)");

    // Ensure scrolling paused and NPCs paused
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    npcCarAnimationsRef.current.forEach(anim => anim.stop());

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    // determine left lanes that could interfere
    // convert targetX (pixel) to lane index estimate
    const targetLaneIndex = Math.round(targetX / tileSize); // 0-based
    // choose NPCs that are in target lane or adjacent left lanes (0 or 1)
    const leftNpcs = npcCars.filter(c => c.lane === targetLaneIndex || c.lane === targetLaneIndex + 1 || c.lane === 0);

    // Animate all relevant left NPCs quickly off-screen to clear path
    try {
      // stop all current loops to avoid conflict
      npcCarAnimationsRef.current.forEach(anim => anim.stop());

      await Promise.all(leftNpcs.map(car => {
        return new Promise(resolve => {
          const isNorth = car.direction === 'NORTH';
          const offscreenTarget = isNorth ? -npcCarHeight * 4 : height + npcCarHeight * 4;
          Animated.timing(car.yAnim, {
            toValue: offscreenTarget,
            duration: 700,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }).start(() => resolve());
        });
      }));
    } catch (err) {
      console.warn("Error animating left NPC(s) out:", err);
    }

    // 1: Move left and slightly forward (player moves to targetX)
    await new Promise(resolve => {
      setPlayerCarDirection("NORTHWEST");
      Animated.parallel([
        Animated.timing(playerCarXAnim, {
          toValue: targetX,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false, // left uses layout, so native driver = false
        }),
        Animated.timing(scrollY, {
          toValue: (currentScroll.current || 0) - (tileSize * 0.8),
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      ]).start(() => {
        currentScroll.current = (currentScroll.current || 0) - (tileSize * 0.8);
        resolve();
      });
    });

    // 2: Move forward past the jeepney
    await new Promise(resolve => {
      setPlayerCarDirection("NORTH");
      Animated.parallel([ // jeepney moves out (so it looks like we pass it)
        Animated.timing(jeepneyYAnim, {
          toValue: height + jeepHeight * 2,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: (currentScroll.current || 0) - (tileSize * 4),
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        currentScroll.current = (currentScroll.current || 0) - (tileSize * 4);
        resolve();
      });
    });

    // 3: Move back to center lane
    await new Promise(resolve => {
      setPlayerCarDirection("NORTHEAST");
      Animated.parallel([
        Animated.timing(playerCarXAnim, {
          toValue: width / 2 - playerCarWidth / 2,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(scrollY, {
          toValue: (currentScroll.current || 0) - (tileSize * 0.8),
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      ]).start(() => {
        currentScroll.current = (currentScroll.current || 0) - (tileSize * 0.8);
        resolve();
      });
    });

    // final adjustments
    setPlayerCarDirection("NORTH");
    setIsJeepneyVisible(false);

    // Restart animations with safer spacing for all NPCs (including those we moved)
    setTimeout(() => {
      if (scrollAnimationRef.current) scrollAnimationRef.current.start();
      npcCarAnimationsRef.current = npcCars.map(car => {
        // Reset NPC car positions with better spacing
        const { direction, yAnim } = car;
        const isNorth = direction === 'NORTH';
        const safeStartValue = isNorth ? height + npcCarHeight * 3 : -npcCarHeight * 3;
        yAnim.setValue(safeStartValue);

        const animation = startNpcCarAnimation(car);
        animation.start();
        return animation;
      });
    }, 500);

    setIsPlayerCarVisible(true);
  };

  // FIXED: Better animation detection
  const handleAnswer = async (chosenOption) => {
    console.log("🎯 Answer chosen:", chosenOption);
    setSelectedAnswer(chosenOption);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = chosenOption === currentQuestion.correct;

    if (isCorrect) {
      handleFeedback(chosenOption);
    } else {
      // Determine animation based on choice text - FIXED: Better detection
      const choiceText = chosenOption.toLowerCase();

      if (choiceText.includes("overtake") || choiceText.includes("cross") || choiceText.includes("yellow")) {
        console.log("🚗💨 Triggering overtaking animation");
        const targetX = 0.5 * tileSize; // Lane 0 position (left-most)
        await animateOvertake(targetX);
        handleFeedback(chosenOption);
      } else if (choiceText.includes("proceed") || choiceText.includes("continue") || choiceText.includes("straight")) {
        console.log("🚗 Triggering proceed animation");
        await animateProceed();
        handleFeedback(chosenOption);
      } else if (choiceText.includes("stop") || choiceText.includes("wait") || choiceText.includes("clear")) {
        console.log("🛑 Triggering stop animation");
        await animateStop();
        handleFeedback(chosenOption);
      } else {
        console.log("❓ No specific animation, showing feedback");
        handleFeedback(chosenOption);
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

  // ✅ DATABASE INTEGRATION - Show loading screen while fetching data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#26a69a" />
        <Text style={styles.loadingText}>Loading scenario...</Text>
      </View>
    );
  }

  // Determine the feedback message
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? (currentQuestionData.correctExplanation || "Correct! Solid yellow lane means you cannot overtake. Stay in your lane to avoid unnecessary accidents.")
    : (currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!");

  if (showIntro) {
    return (
      <View style={styles.introContainer}>
        <Image
          source={require("../../../../../assets/dialog/LTO.png")}
          style={[styles.introLTOImage, { width: ltoWidth, height: ltoHeight * 0.5 }]}
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

      {/* NPC Cars - FIXED: Better positioning */}
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

      {/* FIXED: Question Overlay - Better layout */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")}
            style={[styles.ltoImage, { width: ltoWidth, height: ltoHeight }]}
          />
          <View style={styles.questionBox}>
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionText}>
                {questions[questionIndex].question}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* FIXED: Answers - Non-overlapping layout */}
      {showAnswers && (
        <View style={styles.answersContainer}>
          {questions[questionIndex].options.map((option, index) => (
            <TouchableOpacity
              key={option}
              style={[styles.answerButton, { marginBottom: index < questions[questionIndex].options.length - 1 ? height * 0.01 : 0 }]}
              onPress={() => handleAnswer(option)}
            >
              <Text style={styles.answerText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* FIXED: Feedback - Better layout */}
      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")}
            style={[styles.ltoImage, { width: ltoWidth, height: ltoHeight }]} />
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
  // ✅ DATABASE INTEGRATION - Added loading styles
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

  // FIXED: In-game responsive styles - Better layout
  questionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: height * 0.35, // FIXED: Increased height
    backgroundColor: "rgba(8, 8, 8, 0.8)", // FIXED: Darker background
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: height * 0.02,
    paddingHorizontal: width * 0.02,
    zIndex: 10,
  },
  ltoImage: {
    resizeMode: "contain",
    marginLeft: -width * 0.02,
    marginBottom: -height * 0.05, // FIXED: Better positioning
  },
  questionBox: {
    flex: 1,
    marginBottom: height * 0.08,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: width * 0.02,
  },
  questionTextContainer: {
    maxWidth: width * 0.65, // FIXED: Better width constraint
  },
  questionText: {
    color: "white",
    fontSize: Math.min(width * 0.04, 24), // FIXED: Smaller font to prevent overflow
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: Math.min(width * 0.055, 30), // FIXED: Better line height
  },
  // FIXED: Answers container - Non-overlapping
  answersContainer: {
    position: "absolute",
    top: height * 0.4, // FIXED: Moved higher to avoid overlap
    right: width * 0.03,
    width: width * 0.4, // FIXED: Wider for better text fit
    maxHeight: height * 0.3, // FIXED: Height constraint
    zIndex: 11,
    justifyContent: "flex-start",
  },
  answerButton: {
    backgroundColor: "rgba(51, 51, 51, 0.9)", // FIXED: Semi-transparent
    padding: height * 0.022,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555",
    minHeight: height * 0.06, // FIXED: Minimum height for touch
  },
  answerText: {
    color: "white",
    fontSize: Math.min(width * 0.035, 16), // FIXED: Smaller font for better fit
    textAlign: "center",
    flexWrap: "wrap", // FIXED: Allow text wrapping
    lineHeight: Math.min(width * 0.045, 20),
  },
  // FIXED: Feedback overlay - Better layout
  feedbackOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: height * 0.45,
    backgroundColor: "rgba(8, 8, 8, 0.8)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: height * 0.02,
    paddingHorizontal: width * 0.02,
    zIndex: 10,
  },
  feedbackBox: {
    flex: 1,
    marginBottom: height * 0.08,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: width * 0.02,
  },
  feedbackText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 26), // FIXED: Responsive sizing
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: Math.min(width * 0.06, 32),
    maxWidth: width * 0.65,
  },
  nextButtonContainer: {
    position: "absolute",
    top: height * 0.35, // FIXED: Better positioning
    right: width * 0.05,
    width: width * 0.25,
    alignItems: "center",
    zIndex: 11,
  },
  nextButton: {
    backgroundColor: "#007bff",
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.06,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: width * 0.2,
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
  },
});

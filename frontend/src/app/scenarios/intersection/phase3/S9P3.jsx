import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Map setup - Using single image like pedestrian game
const mapImage = require("../../../../../assets/map/map11.png");
const mapWidth = 320;  // Original map width (5 columns * 64 pixels)
const mapHeight = 768; // Original map height (12 rows * 64 pixels)
const mapScale = width / mapWidth;
const scaledMapHeight = mapHeight * mapScale;

const carSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHEAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  NORTHWEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
};

const npcCarSprites = {
  blue: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  red: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_001.png"),
  ],
  green: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/NORTH/SEPARATED/Green_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/NORTH/SEPARATED/Green_CIVIC_CLEAN_NORTH_001.png"),
  ],
  yellow: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

const questions = [
  {
    question: "You're driving on a mountain highway in Baguio and encounter transition lines that guide traffic around a bridge support structure. The lines gradually shift your lane position to avoid the obstacle.",
    options: ["Follow the transition lines smoothly and gradually", "Maintain your original lane position and ignore the transition markings", "Change lanes abruptly to avoid following the curved path"],
    correct: "Follow the transition lines smoothly and gradually",
    wrongExplanation: {
      "Maintain your original lane position and ignore the transition markings": "Wrong! Ignoring transition lines could lead to collision with the obstacle they're designed to help you avoid.",
      "Change lanes abruptly to avoid following the curved path": "Wrong! Abrupt lane changes defeat the purpose of the gradual transition system and create hazards for other drivers."
    }
  },
];

export default function DrivingGame() {
  const [isCarVisible, setIsCarVisible] = useState(true);

  // Start from bottom of map - map positioned so bottom is visible
  const startOffset = -(scaledMapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  // NPC Cars - static positions (positioned relative to map)
  const [npcCars] = useState([
    { id: 1, color: 'red', x: width * 0.3, y: scaledMapHeight * 0.15, frame: 0 },
    { id: 2, color: 'green', x: width * 0.3, y: scaledMapHeight * 0.55, frame: 0 },
    { id: 3, color: 'yellow', x: width * 0.3, y: scaledMapHeight * 0.45, frame: 0 },
    { id: 4, color: 'blue', x: width * 0.3, y: scaledMapHeight * 0.45, frame: 0 },
    { id: 5, color: 'red', x: width * 0.5, y: scaledMapHeight * 0.6, frame: 0 },
  ]);

  const [npcCarFrames, setNpcCarFrames] = useState(npcCars.map(() => 0));

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  // UI/game states
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);
  const [carDirection, setCarDirection] = useState("NORTH");

  // Car
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const carXAnim = useRef(new Animated.Value(width / 1.1 - carWidth / 2)).current;

  // NPC Cars sprite animation
  useEffect(() => {
    const intervals = npcCars.map((car, index) => {
      return setInterval(() => {
        setNpcCarFrames(prev => {
          const newFrames = [...prev];
          newFrames[index] = (newFrames[index] + 1) % 2;
          return newFrames;
        });
      }, 200);
    });

    return () => intervals.forEach(iv => clearInterval(iv));
  }, []);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    // Move upward (increase the value, making it less negative)
    const stopDistance = scaledMapHeight * 0.25;
    const stopOffset = startOffset + stopDistance;

    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      setShowQuestion(true);
      setTimeout(() => {
        setShowAnswers(true);
      }, 1000);
    });
  }
  
  useEffect(() => {
    startScrollAnimation();
  }, []);

  // Car sprite frame loop (stops when carPaused=true)
  useEffect(() => {
    let iv;
    if (!carPaused && carSprites[carDirection]) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection]);

  // feedback anims
  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);

  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    if (answerGiven === currentQuestion.correct) {
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

  const handleAnswer = async (answer) => {  
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    if (answer === "Follow the transition lines smoothly and gradually") {
      // Step 1: Move forward slightly
      const initialScroll = currentScroll.current + scaledMapHeight * 0.05;
      
      setCarDirection("NORTH");
      setCarFrame(0);

      Animated.timing(scrollY, {
        toValue: initialScroll,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        // Step 2: Smoothly transition to left lane using NORTHWEST
        const leftLaneX = width * 0.7 - carWidth / 2;
        
        setCarDirection("NORTHWEST");
        setCarFrame(0);
        
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: leftLaneX,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(scrollY, {
            toValue: initialScroll + scaledMapHeight * 0.08,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Step 3: Continue forward in left lane
          setCarDirection("NORTH");
          setCarFrame(0);
          
          Animated.timing(scrollY, {
            toValue: initialScroll + scaledMapHeight * 0.12,
            duration: 1500,
            useNativeDriver: true,
          }).start(() => {
            setCarPaused(true);
            setTimeout(() => {
              setIsCarVisible(false);
              handleFeedback(answer);
            }, 1000);
          });
        });
      });
      return;
    } else if (answer === "Maintain your original lane position and ignore the transition markings") {
      // Just drive straight forward
      const targetScroll = currentScroll.current + scaledMapHeight * 0.15;
      
      setCarDirection("NORTH");
      setCarFrame(0);

      Animated.timing(scrollY, {
        toValue: targetScroll,
        duration: 2500,
        useNativeDriver: true,
      }).start(() => {
        setCarPaused(true);
        setTimeout(() => {
          setIsCarVisible(false);
          handleFeedback(answer);
        }, 1000);
      });
      return;
    } else if (answer === "Change lanes abruptly to avoid following the curved path") {
      // Immediately change to left lane (abrupt)
      const leftLaneX = width * 0.7 - carWidth / 2;
      
      setCarDirection("NORTHWEST");
      setCarFrame(0);

      Animated.parallel([
        Animated.timing(carXAnim, {
          toValue: leftLaneX,
          duration: 800, // Faster/abrupt movement
          useNativeDriver: false,
        }),
        Animated.timing(scrollY, {
          toValue: currentScroll.current + scaledMapHeight * 0.05,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Continue forward in left lane
        setCarDirection("NORTH");
        setCarFrame(0);
        
        Animated.timing(scrollY, {
          toValue: currentScroll.current + scaledMapHeight * 0.1,
          duration: 1500,
          useNativeDriver: true,
        }).start(() => {
          setCarPaused(true);
          setTimeout(() => {
            setIsCarVisible(false);
            handleFeedback(answer);
          }, 1000);
        });
      });
      return;
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    setIsCorrectAnswer(null);
    
    // Reset car position and visibility
    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setCarPaused(false);
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      Alert.alert('Complete', 'Scenario completed!');
    }
  };

  // Calculate feedback message
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correcty! Transition lines are specifically designed to guide traffic safely around obstacles while maintaining proper lane spacing and traffic flow."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  // Ensure car sprite exists for current direction
  const currentCarSprite = carSprites[carDirection] && carSprites[carDirection][carFrame] 
    ? carSprites[carDirection][carFrame] 
    : carSprites["NORTH"][0];

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Map - Single image like pedestrian game */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: scaledMapHeight,
          left: 0,
          transform: [{ translateY: scrollY }],
          zIndex: 1,
        }}
      >
        <Image
          source={mapImage}
          style={{
            width: width,
            height: scaledMapHeight,
          }}
          resizeMode="stretch"
        />
      </Animated.View>

      {/* NPC Cars - Static positions */}
      {npcCars.map((car, index) => (
        <Animated.Image
          key={car.id}
          source={npcCarSprites[car.color][npcCarFrames[index]]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            left: car.x - carWidth / 2,
            top: car.y,
            transform: [{ translateY: scrollY }],
            zIndex: 5,
          }}
        />
      ))}

      {/* Player Car - fixed at bottom */}
      {isCarVisible && (
        <Animated.Image
          source={currentCarSprite}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: 80,
            left: carXAnim,
            zIndex: 8,
          }}
        />
      )}

      {/* Question overlay - moved to bottom */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image
            source={require("../../../../../assets/dialog/LTO.png")}
            style={styles.ltoImage}
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

      {/* Answers - moved above bottom overlay */}
      {showAnswers && (
        <View style={styles.answersContainer}>
          {questions[questionIndex].options.map((option) => (
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

      {/* Feedback - moved to bottom */}
      {animationType === "correct" && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </View>
      )}

      {animationType === "wrong" && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>
                {feedbackMessage}
            </Text>
          </View>
        </View>
      )}

      {/* Next button - positioned above bottom overlay */}
      {showNext && (
        <View style={styles.nextButtonContainer}>
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
    paddingBottom: 0,
    zIndex: 10,
  },
  ltoImage: {
    width: ltoWidth,
    height: ltoHeight,
    resizeMode: "contain",
    marginLeft: -width * 0.03,
    marginBottom: -height * 0.12,
  },
  questionBox: {
    flex: 1,
    bottom: height * 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  questionTextContainer: {
    padding: -height * 0.04,
    maxWidth: width * 0.7,
  },
  questionText: {
    flexWrap: "wrap",
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.16,
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
    fontSize: Math.min(width * 0.06, 24),
    fontWeight: "bold",
    textAlign: "center",
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
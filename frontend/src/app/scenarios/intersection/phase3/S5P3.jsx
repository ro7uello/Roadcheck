import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing, Alert } from "react-native";
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
  road3: require("../../../../../assets/road/road3.png"),
  road4: require("../../../../../assets/road/road4.png"),
  road16: require("../../../../../assets/road/road16.png"),
  road17: require("../../../../../assets/road/road17.png"),
  road18: require("../../../../../assets/road/road18.png"),
  road19: require("../../../../../assets/road/road19.png"),
  road59: require("../../../../../assets/road/road59.png"),
  road20: require("../../../../../assets/road/road20.png"),
  road23: require("../../../../../assets/road/road23.png"),
  road24: require("../../../../../assets/road/road24.png"),
  road49: require("../../../../../assets/road/road49.png"),
  road50: require("../../../../../assets/road/road50.png"),
  road51: require("../../../../../assets/road/road51.png"),
  road52: require("../../../../../assets/road/road52.png"),
  road57: require("../../../../../assets/road/road57.png"),
  road58: require("../../../../../assets/road/road58.png"),
  road59: require("../../../../../assets/road/road59.png"),
  road60: require("../../../../../assets/road/road60.png"),
  road15: require("../../../../../assets/road/road15.png"),
  road22: require("../../../../../assets/road/road22.png"),
  int1: require("../../../../../assets/road/int1.png"),
  int2: require("../../../../../assets/road/int2.png"),
  int3: require("../../../../../assets/road/int3.png"),
  int4: require("../../../../../assets/road/int4.png"),
};

const mapLayout = [
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
  ["road4", "road3", "road4", "road3"],
];

const carSprites = {
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

// Rain drop component
const RainDrop = ({ style }) => (
  <View style={[styles.rainDrop, style]} />
);

// Updated question structure
const questions = [
  {
    question: "You're driving on a provincial highway at night during light rain. The cat's eye reflectors (reflective pavement markers) are helping you see the lane boundaries clearly while other road markings are harder to see.",
    options: [
      "Drive faster since the cat's eyes make navigation easier", 
      "Maintain reduced speed appropriate for rain conditions and use the cat's eyes as lane guides", 
      "Turn on high beams to see better instead of relying on the reflectors"
    ],
    correct: "Maintain reduced speed appropriate for rain conditions and use the cat's eyes as lane guides",
    wrongExplanation: {   
      "Drive faster since the cat's eyes make navigation easier": "Wrong! Cat's eyes aid visibility but don't eliminate other hazards like wet road conditions that require reduced speeds.",
      "Turn on high beams to see better instead of relying on the reflectors": "Wrong! High beams can cause glare in rain and may blind oncoming drivers. Cat's eyes are specifically designed for this situation."
    },
    correctExplanation: "Correct! Cat's eyes are designed to provide lane guidance in low visibility conditions, but safe driving still requires speed appropriate for weather."
  },
];

export default function DrivingGame() {

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isCarVisible, setIsCarVisible] = useState(true);

  const startOffset = -(mapHeight - height);

  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  // Rain animation
  const [rainDrops, setRainDrops] = useState([]);
  const rainOpacity = useRef(new Animated.Value(1)).current;

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
  const [carDirection, setCarDirection] = useState("NORTH");
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);

  // Animation speed control
  const [animationSpeed, setAnimationSpeed] = useState(4000);

  // Position car in 3rd column (index 2) of road4
  const carXAnim = useRef(new Animated.Value(2 * tileSize + tileSize/2 - carWidth/2)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Rain effect initialization
  useEffect(() => {
    const generateRainDrops = () => {
      const drops = [];
      for (let i = 0; i < 50; i++) {
        drops.push({
          id: i,
          x: Math.random() * width,
          animatedValue: new Animated.Value(-20),
          delay: Math.random() * 2000,
        });
      }
      setRainDrops(drops);
    };

    generateRainDrops();
  }, []);

  // Rain animation
  useEffect(() => {
    const animateRain = () => {
      rainDrops.forEach((drop) => {
        const animateDropLoop = () => {
          drop.animatedValue.setValue(-20);
          Animated.timing(drop.animatedValue, {
            toValue: height + 20,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true,
          }).start(() => {
            animateDropLoop();
          });
        };
        
        setTimeout(() => {
          animateDropLoop();
        }, drop.delay);
      });
    };

    if (rainDrops.length > 0) {
      animateRain();
    }
  }, [rainDrops]);

  // Car animation frame cycling
  useEffect(() => {
    let iv;
    if (!carPaused) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites[carDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused, carDirection]);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    
    const stopRow = 6.5;
    const stopOffset = startOffset + stopRow * tileSize;

    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: animationSpeed,
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
  }, [animationSpeed]);

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
    const currentQuestion = questions[questionIndex];
      const isCorrect = answer === currentQuestion.correct;
    const currentRow = Math.abs(currentScroll.current - startOffset) / tileSize;

  if (answer === "Drive faster since the cat's eyes make navigation easier") {
      setCarDirection("NORTH");
      
      Animated.timing(scrollY, {
        toValue: currentScroll.current + 4 * tileSize,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          handleFeedback(answer);
        });
      });
    } else if (answer === "Maintain reduced speed appropriate for rain conditions and use the cat's eyes as lane guides") {
      // Animation: Car continues straight smoothly in the same lane
      setCarDirection("NORTH");
      
      Animated.timing(scrollY, {
        toValue: currentScroll.current + 4 * tileSize,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          handleFeedback(answer);
        });
      });
      
   } else if (answer === "Turn on high beams to see better instead of relying on the reflectors") {
      // Animation: Car moves toward center (dangerously close to opposing lane)
      setCarDirection("NORTH");
      
      // Move car to column 1 (center/opposing lane area)
      Animated.parallel([
        Animated.timing(carXAnim, {
          toValue: 1.5 * tileSize + tileSize/2 - carWidth/2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: currentScroll.current + 4 * tileSize,
          duration: 1500, // Slower speed
          useNativeDriver: true,
        })
      ]).start(() => {
        handleFeedback(answer);
      });
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setCarFrame(0);
    setCarPaused(false);
    setAnimationSpeed(4000);

    // Reset car to column 2 (3rd column)
    const centerX = 2 * tileSize + tileSize/2 - carWidth/2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      Alert.alert('Complete', 'Scenario completed!');
    }
  };

  // Determine the feedback message
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? currentQuestionData.correctExplanation
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

  // Cat's eyes reflectors on road markings
  const renderCatsEyes = () => {
    const catsEyes = [];
    
    // Center line cat's eyes (between columns 1 and 2)
    for (let row = 0; row < mapLayout.length; row++) {
      // Amber/yellow cat's eyes for center line
      catsEyes.push(
        <View
          key={`cats-eye-center-${row}`}
          style={[
            styles.catsEye,
            styles.catsEyeAmber,
            {
              position: 'absolute',
              left: 2 * tileSize - 4,
              top: row * tileSize + tileSize * 0.5 - 4,
            }
          ]}
        />
      );
    }
    
    // Edge line cat's eyes (between columns 2 and 3)
    for (let row = 0; row < mapLayout.length; row++) {
      // White cat's eyes for edge line
      catsEyes.push(
        <View
          key={`cats-eye-edge-${row}`}
          style={[
            styles.catsEye,
            styles.catsEyeWhite,
            {
              position: 'absolute',
              left: 3 * tileSize - 4,
              top: row * tileSize + tileSize * 0.5 - 4,
            }
          ]}
        />
      );
    }
    
    return catsEyes;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#2c3e50" }}>
      {/* Rain Effect */}
      <Animated.View style={[styles.rainContainer, { opacity: rainOpacity }]}>
        {rainDrops.map((drop) => (
          <Animated.View
            key={drop.id}
            style={[
              styles.rainDrop,
              {
                left: drop.x,
                transform: [{ translateY: drop.animatedValue }],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Map */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: mapHeight,
          left: 0,
          transform: [{ translateY: scrollY }],
          zIndex: 1,
        }}
      >
        {mapLayout.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <Image
              key={`${rowIndex}-${colIndex}`}
              source={roadTiles[tile]}
              style={{
                position: "absolute",
                width: tileSize,
                height: tileSize,
                left: colIndex * tileSize,
                top: rowIndex * tileSize,
              }}
              resizeMode="stretch"
            />
          ))
        )}
        
        {/* Cat's Eyes Reflectors */}
        {renderCatsEyes()}
      </Animated.View>

      {/* Car */}
      {isCarVisible && (
        <Animated.Image
          source={carSprites[carDirection][carFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            bottom: height * 0.1,
            transform: [{ translateX: carXAnim }],
            zIndex: 5,
          }}
        />
      )}

      {/* Question Overlay */}
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

      {/* Answers */}
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

      {/* Feedback */}
      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
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

  // ADDED: Intro styles (responsive)
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
    height: overlayHeight, // Corrected line: use the variable directly
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
    top: height * 0.11,
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
    height: overlayHeight, // Corrected line: use the variable directly
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
  // Rain and cat's eyes effects
  rainContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 8,
    pointerEvents: 'none',
  },
  rainDrop: {
    position: 'absolute',
    width: 2,
    height: 15,
    backgroundColor: '#87CEEB',
    opacity: 0.7,
    borderRadius: 1,
  },
  catsEye: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#ffea00ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 3,
  },
  catsEyeAmber: {
    backgroundColor: '#ffea00ff',
  },
  catsEyeWhite: {
    backgroundColor: '#ffea00ff',
  },
});
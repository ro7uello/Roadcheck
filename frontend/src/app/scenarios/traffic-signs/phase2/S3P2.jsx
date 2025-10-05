import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
  road2: require("../../../../../assets/road/road2.png"),
  road3: require("../../../../../assets/road/road3.png"),
  road4: require("../../../../../assets/road/road4.png"),
  road17:require("../../../../../assets/road/road17.png"),
};

const mapLayout = [
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],
  ["road4", "road2", "road2", "road3", "road17"],

];

const carSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

// NPC Car sprites (you can use different colors or the same sprites)
const npcCarSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

const questions = [
  {
    question: "You're driving on Ayala Avenue in Makati and notice a 60 KPH SPEED LIMIT sign. Traffic is moving smoothly, and other vehicles around you are traveling at approximately 70-80 kph. Your speedometer shows 75 kph.",
    options: ["Match the speed of surrounding traffic for convenience", "Reduce your speed to 60 kph or below to comply with the sign", "Continue at 75 kph since it's close to the limit"],
    correct: "Reduce your speed to 60 kph or below to comply with the sign",
    wrongExplanation: {
      "Match the speed of surrounding traffic for convenience": "Wrong! Following other vehicles' illegal speeds doesn't excuse your own violation.",
      "Continue at 75 kph since it's close to the limit": "Wrong! Exceeding the speed limit by any amount is a violation."
    }
  },
  // Add more questions here as needed
];

// Traffic light sprites
const trafficSign = {
    sign: require("../../../../../assets/signs/max_60.png"),
};

export default function DrivingGame() {

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  const trafficSignRowIndex = 10;
  const trafficSignColIndex = 3.78;
  const trafficSignXOffset = -20;

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

  // Player Car
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const carXAnim = useRef(new Animated.Value(width / 2 - (280 / 2))).current;

  // NPC Cars state
  const [npcCars, setNpcCars] = useState([]);
  const [npcCarFrames, setNpcCarFrames] = useState({});
  const [npcCarsPaused, setNpcCarsPaused] = useState(false);

  // Initialize NPC cars
  useEffect(() => {
    const initializeNpcCars = () => {
      const cars = [
        {
          id: 'npc1',
          x: width * 0, // Left lane
          startRow: 15,
          animRef: new Animated.Value(startOffset + 15 * tileSize)
        },
        {
          id: 'npc2',
          x: width * 0.15, // Middle-left lane
          startRow: 12,
          animRef: new Animated.Value(startOffset + 12 * tileSize)
        },
        {
          id: 'npc3',
          x: width * 0.55, // Right lane
          startRow: 14,
          animRef: new Animated.Value(startOffset + 14 * tileSize)
        }
      ];
      setNpcCars(cars);
      
      // Initialize frames for each NPC car
      const frames = {};
      cars.forEach(car => {
        frames[car.id] = 0;
      });
      setNpcCarFrames(frames);
    };

    initializeNpcCars();
  }, []);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 6; // Adjusted to match the visual stop point
    const stopOffset = startOffset + stopRow * tileSize;

    // Animate player car
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

    // Animate NPC cars faster than player car
    npcCars.forEach(car => {
      const npcStopOffset = car.animRef._value + (stopOffset - startOffset);
      Animated.timing(car.animRef, {
        toValue: npcStopOffset,
        duration: 2000, // Faster than player car
        useNativeDriver: true,
      }).start();
    });
  }
  
  useEffect(() => {
    if (npcCars.length > 0) {
      startScrollAnimation();
    }
  }, [npcCars]);

  // Player car sprite frame loop (stops when carPaused=true)
  useEffect(() => {
    let iv;
    if (!carPaused) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites["NORTH"].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused]);

  // NPC cars sprite frame loop
  useEffect(() => {
    let iv;
    if (!npcCarsPaused) {
      iv = setInterval(() => {
        setNpcCarFrames(prevFrames => {
          const newFrames = {};
          Object.keys(prevFrames).forEach(carId => {
            newFrames[carId] = (prevFrames[carId] + 1) % npcCarSprites["NORTH"].length;
          });
          return newFrames;
        });
      }, 200);
    }
    return () => clearInterval(iv);
  }, [npcCarsPaused]);

  // feedback anims
  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);

  const handleFeedback = (answerGiven) => {
      const currentQuestion = questions[questionIndex];
      if (answerGiven === currentQuestion.correct) {
        setIsCorrectAnswer(true); // Set to true for correct feedback
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
        setIsCorrectAnswer(false); // Set to false for wrong feedback
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
  

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);

    if (answer === "Match the speed of surrounding traffic for convenience" || 
        answer === "Continue at 75 kph since it's close to the limit") {
      // Both wrong answers: Player and NPCs continue at fast speed
      const targetRow = 12;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      
      // Animate player car at normal speed
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(answer);
      });

      // Animate NPC cars faster than player
      npcCars.forEach(car => {
        const currentNpcRow = Math.round((car.animRef._value - startOffset) / tileSize);
        const npcRowsToMove = targetRow - currentNpcRow;
        const npcNextTarget = car.animRef._value + npcRowsToMove * tileSize;
        
        Animated.timing(car.animRef, {
          toValue: npcNextTarget,
          duration: 2000, // Faster than player car
          useNativeDriver: true,
        }).start();
      });

    }else if (answer === "Reduce your speed to 60 kph or below to comply with the sign") {
        const targetRow = 12;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      
      // Animate player car at normal speed
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 4000,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(answer);
      });

      // Animate NPC cars faster than player
      npcCars.forEach(car => {
        const currentNpcRow = Math.round((car.animRef._value - startOffset) / tileSize);
        const npcRowsToMove = targetRow - currentNpcRow;
        const npcNextTarget = car.animRef._value + npcRowsToMove * tileSize;
        
        Animated.timing(car.animRef, {
          toValue: npcNextTarget,
          duration: 2000, // Faster than player car
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    carXAnim.setValue(width / 2 - (280 / 2));

    // Reset NPC car frames
    const resetFrames = {};
    npcCars.forEach(car => {
      resetFrames[car.id] = 0;
    });
    setNpcCarFrames(resetFrames);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/driver-game/signs/phase-2/S4P2');
      setQuestionIndex(0);
      setShowQuestion(false);
    }
  };

  // Calculate traffic light position
  const trafficSignLeft = trafficSignColIndex * tileSize + trafficSignXOffset;
  const trafficSignTop = trafficSignRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You should always follow posted speed limits, even if other drivers are exceeding them."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";


  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
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
        {/*Traffic Sign */}
        <Image
        source={trafficSign.sign}
        style={{
            width: tileSize * 1,
            height: tileSize *1,
            position: "absolute",
            top: trafficSignTop,
            left: trafficSignLeft,
            zIndex: 11,
        }}
        resizeMode="contain"
        />
      </Animated.View>

      {/* NPC Cars */}
      {npcCars.map(car => (
        <Animated.Image
          key={car.id}
          source={npcCarSprites["NORTH"][npcCarFrames[car.id] || 0]}
          style={{
            width: 350, // Same size as player car
            height: 420,
            position: "absolute",
            left: car.x,
            transform: [{ translateY: car.animRef }],
            zIndex: 7,
          }}
          resizeMode="contain"
        />
      ))}

      {/* Player Car - fixed */}
      <Animated.Image
        source={carSprites["NORTH"][carFrame]}
        style={{
          width: 280,
          height: 350,
          position: "absolute",
          bottom: 80,
          left: carXAnim,
          zIndex: 8,
        }}
      />

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
  // ✅ DATABASE INTEGRATION - Added loading styles
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
  // No intro styles (responsive)
  // In-game responsive styles
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
    top: height * 0.2,
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
    fontSize: Math.min(width * 0.04, 16),
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
});
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
const carWidth = Math.min(width * 0.25, 280);
const carHeight = carWidth * (350/280);
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
  int1: require("../../../../../assets/road/int1.png"),
  int2: require("../../../../../assets/road/int2.png"),
  int3: require("../../../../../assets/road/int3.png"),
  int4: require("../../../../../assets/road/int4.png"),

};

const mapLayout = [
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road49", "road59", "road57", "road50", "road52"],
  ["road60", "int3", "int4", "road60", "road24"],
  ["road58", "int2", "int1", "road58", "road23"],
  ["road19", "road59", "road57", "road16", "road51"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
];

const carSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

const ambulanceSprite = {
    EAST: [
        require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_000.png"),
        require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_001.png"),
        require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_002.png"),
        require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_003.png"),
        require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_004.png"),
        require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_005.png"),
        require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_006.png"),
        require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_007.png"),
        require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_008.png"),
        require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_009.png"),
        require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_010.png"),
        require("../../../../../assets/car/AMBULANCE TOPDOWN/MOVE/EAST/SEPARATED/AMBULANCE_CLEAN_EAST_011.png"),
    ],
};

const questions = [
  {
    question: "You are on an intersection. Your traffic light turned green but on your left, you noticed that an ambulance with sirens and flashing lights is going to cross.",
    options: ["Proceed through the intersection since you have the green light.", "Speed up so you can cross before the ambulance cross the intersection", "Stop and yield to the emergency vehicle."],
    correct: "Stop and yield to the emergency vehicle.",
    wrongExplanation: {
      "Proceed through the intersection since you have the green light.": "Accident prone! Vehicles must yield and give way to emergency vehicles no matter the situation.",
      "Speed up so you can cross before the ambulance cross the intersection": "Accident prone! Vehicles must yield and give way to emergency vehicles no matter the situation."
    }
  },
  // Add more questions here as needed
];

// Traffic light sprites
const trafficLightSprites = {
  normal: require("../../../../../assets/traffic light/Traffic_Light.png"),
  green: require("../../../../../assets/traffic light/traffic_light_green2.png"),
};

export default function DrivingGame() {

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isCarVisible, setIsCarVisible] = useState(true);

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  // Traffic light position (place it before the pedestrian crossing)
  const trafficLightRowIndex = 9.2; // One row before the 'crossing' point
  const trafficLightColIndex = 2; // Left side of the road
  const trafficLightXOffset = -30;

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
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;

  // Ambulance states
  const [showAmbulance, setShowAmbulance] = useState(false);
  const [ambulanceFrame, setAmbulanceFrame] = useState(0);
  const ambulanceXAnim = useRef(new Animated.Value(-carWidth)).current; // Start off-screen left
  const ambulanceYAnim = useRef(new Animated.Value(0)).current;

  // Traffic light
  const [trafficLightState, setTrafficLightState] = useState('green');


  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 6.5; // Adjusted to match the visual stop point
    const stopOffset = startOffset + stopRow * tileSize;

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
    if (!carPaused) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites["NORTH"].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused]);

  // Ambulance sprite frame loop
  useEffect(() => {
    let iv;
    if (showAmbulance) {
      iv = setInterval(() => {
        setAmbulanceFrame((p) => (p + 1) % ambulanceSprite.EAST.length);
      }, 150); // Slightly faster animation for emergency vehicle
    }
    return () => clearInterval(iv);
  }, [showAmbulance]);

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

  const animateAmbulanceCrossing = () => {
    // Position ambulance at the intersection row (row 10 approximately)
    const intersectionRow = 10;
    const ambulanceY = height - (intersectionRow * tileSize) + Math.abs(currentScroll.current - startOffset);
    
    ambulanceYAnim.setValue(ambulanceY);
    ambulanceXAnim.setValue(-carWidth); // Start off-screen left
    
    setShowAmbulance(true);
    
    // Animate ambulance crossing from left to right
    Animated.timing(ambulanceXAnim, {
      toValue: width + carWidth, // End off-screen right
      duration: 3000, // 3 seconds to cross
      useNativeDriver: true,
    }).start(() => {
      setShowAmbulance(false);
      
      // After ambulance crosses, continue car movement
      const finalTarget = currentScroll.current + (1 * tileSize); // Move one more row forward
      
      setCarPaused(false);
      Animated.timing(scrollY, {
        toValue: finalTarget,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback("Stop and yield to the emergency vehicle.");
      });
    });
  };

  const animateCollision = () => {
    // Position ambulance at the intersection for collision
    const intersectionRow = 10;
    const ambulanceY = height - (intersectionRow * tileSize) + Math.abs(currentScroll.current - startOffset);
    
    ambulanceYAnim.setValue(ambulanceY);
    ambulanceXAnim.setValue(-carWidth); // Start off-screen left
    
    setShowAmbulance(true);
    
    // Start ambulance crossing animation
    Animated.timing(ambulanceXAnim, {
      toValue: width / 3.8, // Stop at center where collision will occur
      duration: 1000, // 2 seconds to reach collision point
      useNativeDriver: true,
    }).start(() => {
      // Show collision feedback immediately
      handleFeedback("Proceed through the intersection since you have the green light.");
    });
  };
  

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);

    if (answer === "Proceed through the intersection since you have the green light.") {
      const targetRow = 8.5;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;

        setCarPaused(true); // Car pauses as if yielding
        setTimeout(() => {
            setCarPaused(false); // Car resumes after a short pause
            Animated.timing(scrollY, {
                toValue: nextTarget,
                duration: 3000,
                useNativeDriver: true,
            }).start(() => {
                animateCollision();
                handleFeedback(answer);
            });
        }); 
      return;
    } else if (answer === "Speed up so you can cross before the ambulance cross the intersection") {
        // Since there's no pedestrian, "yielding" means pausing briefly and then proceeding.
        const targetRow = 12;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;

        setCarPaused(true); // Car pauses as if yielding
        setTimeout(() => {
            setCarPaused(false); // Car resumes after a short pause
            Animated.timing(scrollY, {
                toValue: nextTarget,
                duration: 3000,
                useNativeDriver: true,
            }).start(() => {
                handleFeedback(answer);
            });
        }); 
    } else if(answer === "Stop and yield to the emergency vehicle."){
        // Move car forward to row 7.5 first
        const targetRow = 7.5;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;

        setCarPaused(true); // Car stops to yield
        
        Animated.timing(scrollY, {
            toValue: nextTarget,
            duration: 2000,
            useNativeDriver: true,
        }).start(() => {
            // Once car is at row 7.5, start ambulance crossing animation
            setTimeout(() => {
              animateAmbulanceCrossing();
            }, 500); // Small delay before ambulance appears
        });
    }
}

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    carXAnim.setValue(width / 2 - (280 / 2));

    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    
    // Reset ambulance
    setShowAmbulance(false);
    setAmbulanceFrame(0);
    ambulanceXAnim.setValue(-carWidth);
    
    setTrafficLightState('green');
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/driver-game/signs/phase-1/S10P1');
      setQuestionIndex(0);
      setShowQuestion(false);
    }
  };

  // Calculate traffic light position
  const trafficLightLeft = trafficLightColIndex * tileSize + trafficLightXOffset;
  const trafficLightTop = trafficLightRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You must give way to emergency vehicles even if you have the green light."
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
        {/* Traffic Light */}
        <Image
          source={trafficLightSprites[trafficLightState]}
          style={{
            width: tileSize * 1.5,
            height: tileSize * 2,
            position: "absolute",
            top: trafficLightTop,
            left: trafficLightLeft,
            zIndex: 10,
          }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Ambulance - positioned relative to screen, not map */}
      {showAmbulance && (
        <Animated.Image
          source={ambulanceSprite.EAST[ambulanceFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            transform: [
              { translateX: ambulanceXAnim },
              { translateY: ambulanceYAnim }
            ],
            zIndex: 9,
          }}
          resizeMode="contain"
        />
      )}

      {/* Car - fixed */}
      <Animated.Image
        source={carSprites[carDirection][carFrame]}
        style={{
          width: carWidth,
          height: carHeight,
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
    fontSize: Math.min(width * 0.045, 24),
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
});
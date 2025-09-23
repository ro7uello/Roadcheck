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
  road3: require("../../../../assets/road/road3.png"),
  road4: require("../../../../assets/road/road4.png"),
  road16: require("../../../../assets/road/road16.png"),
  road17: require("../../../../assets/road/road17.png"),
  road18: require("../../../../assets/road/road18.png"),
  road19: require("../../../../assets/road/road19.png"),
  road59: require("../../../../assets/road/road59.png"),
  road20: require("../../../../assets/road/road20.png"),
  road23: require("../../../../assets/road/road23.png"),
  road24: require("../../../../assets/road/road24.png"),
  road49: require("../../../../assets/road/road49.png"),
  road50: require("../../../../assets/road/road50.png"),
  road51: require("../../../../assets/road/road51.png"),
  road52: require("../../../../assets/road/road52.png"),
  road57: require("../../../../assets/road/road57.png"),
  road58: require("../../../../assets/road/road58.png"),
  road59: require("../../../../assets/road/road59.png"),
  road60: require("../../../../assets/road/road60.png"),
  int1: require("../../../../assets/road/int1.png"),
  int2: require("../../../../assets/road/int2.png"),
  int3: require("../../../../assets/road/int3.png"),
  int4: require("../../../../assets/road/int4.png"),

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
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

const questions = [
  {
    question: "You are driving down a highway intersection. The light is green but there is still a heavy predestran traffic crossing",
    options: ["Proceed since you have the green light.", "Honk to warn the pedestrian and proceed slowly.", "Yield the right of way to pedestrian and proceed when it's clear."],
    correct: "Yield the right of way to pedestrian and proceed when it's clear.",
    wrongExplanation: {
      "Proceed since you have the green light.": "Accident prone! When pedestrians are on the marked ped xing, they have the right of way and drivers must yield to them even if their traffic light is green.",
      "Honk to warn the pedestrian and proceed slowly.": "Accident prone! When pedestrians are on the marked ped xing, they have the right of way and drivers must yield to them even if their traffic light is green."
    }
  },
  // Add more questions here as needed
];

const maleStandingSprite = require("../../../../assets/character/stand.png");
const maleWalkSprites = [
  require("../../../../assets/character/walk1.png"),
  require("../../../../assets/character/walk2.png"),
  require("../../../../assets/character/walk3.png"),
  require("../../../../assets/character/walk4.png"),
];

// Traffic light sprites
const trafficLightSprites = {
  normal: require("../../../../assets/traffic light/Traffic_Light.png"),
  green: require("../../../../assets/traffic light/traffic_light_green2.png"),
};

const FRAME_WIDTH = 160;
const FRAME_HEIGHT = 200;

export default function DrivingGame() {
  const [showIntro, setShowIntro] = useState(true);

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  // Pedestrian initial position relative to the map
  const pedestrianRowIndex = 9;
  const pedestrianColIndex = numColumns - 2;
  const pedestrianXOffset = -50;

  // Traffic light position (place it before the pedestrian crossing)
  const trafficLightRowIndex = 9; // One row before the pedestrian
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

  // Car
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const carXAnim = useRef(new Animated.Value(width / 2 - (280 / 2))).current;

  // Pedestrian
  const [isCrossing, setIsCrossing] = useState(false);
  const [pedestrianVisible, setPedestrianVisible] = useState(true);
  const [maleFrame, setMaleFrame] = useState(0);
  const maleCrossingXAnim = useRef(new Animated.Value(0)).current;
  const [maleVerticalOffset, setMaleVerticalOffset] = useState(0);

  // Traffic light - Start blinking immediately
  const [trafficLightState, setTrafficLightState] = useState('green');
  const [isBlinking, setIsBlinking] = useState(true);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 6.5;
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

  // Male walking frame loop (ONLY when crossing)
  useEffect(() => {
    let iv;
    if (isCrossing) {
      iv = setInterval(() => {
        setMaleFrame((p) => (p + 1) % maleWalkSprites.length);
      }, 150);
    }
    return () => clearInterval(iv);
  }, [isCrossing]);

 { /*// Traffic light blinking effect - starts immediately and continues
  useEffect(() => {
    let blinkInterval;
    if (isBlinking) {
      blinkInterval = setInterval(() => {
        setTrafficLightState(prev => prev === 'normal' ? 'green' : 'normal');
      }, 500); // Blink every 500ms
    }
    return () => {
      if (blinkInterval) {
        clearInterval(blinkInterval);
      }
    };
  }, [isBlinking]);
*/} // FOR BLINKING

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

    if (answer === "Honk to warn the pedestrian and proceed slowly.") {
      const targetRow = 11;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      // Traffic light continues blinking (no change needed)
      // Start pedestrian crossing
      maleCrossingXAnim.setValue(pedestrianColIndex * tileSize + pedestrianXOffset);
      setIsCrossing(true);
      setMaleFrame(0);
      // Pedestrian crosses (slower)
      Animated.timing(maleCrossingXAnim, {
        fromValue: pedestrianColIndex * tileSize + pedestrianXOffset,
        toValue: (pedestrianColIndex - 2) * tileSize + pedestrianXOffset,
        duration: 2000,
        useNativeDriver: false,
      }).start();
      // Car continues moving (doesn't stop) - collision happens
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => {
        // Collision effect - hide pedestrian immediately
        setIsCrossing(false);
        setPedestrianVisible(false);
        // Keep traffic light blinking
        handleFeedback(answer);
      });
    } else if (answer === "Yield the right of way to pedestrian and proceed when it's clear.") {
        const targetRow = 10;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;

        maleCrossingXAnim.setValue(pedestrianColIndex * tileSize + pedestrianXOffset);

        setCarPaused(true);
        setIsCrossing(true);
        setMaleFrame(0);

        Animated.timing(maleCrossingXAnim, {
        fromValue: pedestrianColIndex * tileSize + pedestrianXOffset,
        toValue: (pedestrianColIndex - 3) * tileSize + pedestrianXOffset,
        duration: 4000,
        useNativeDriver: false,
      }).start(() => {
        setIsCrossing(false);
        setPedestrianVisible(false);
        setCarPaused(false);

        Animated.timing(scrollY, {
          toValue: nextTarget,
          duration: 3000,
          useNativeDriver: true,
        }).start(() => {
          handleFeedback(answer);
        });
      });
    }else if(answer === "Proceed since you have the green light."){
        const targetRow = 10;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;
        Animated.timing(scrollY, {
          toValue: nextTarget,
          duration: 2000,
          useNativeDriver: true,
        }).start(() => {
          handleFeedback(answer);
        });
        return;
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    carXAnim.setValue(width / 2 - (280 / 2));
    setPedestrianVisible(true);
    // Reset traffic light to blinking state
    setTrafficLightState('green');
    setIsBlinking(false); //SET TO TRUE FOR BLINKING
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/driver-game/signs/phase-1/S2P1');
      setQuestionIndex(0);
      setShowQuestion(false);
    }
  };

    const handleStartGame = () => {
    setShowIntro(false);
  };

  // Calculate pedestrian's fixed horizontal position
  const maleFixedLeft = pedestrianColIndex * tileSize + pedestrianXOffset;

  // Calculate traffic light position
  const trafficLightLeft = trafficLightColIndex * tileSize + trafficLightXOffset;
  const trafficLightTop = trafficLightRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Even if the light is green, when you see pedestrians on the road always slow down and yield the right of way to pedestrians if you have to."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  if (showIntro) {
      return (
        <View style={styles.introContainer}>
          <Image
            source={require("../../../../assets/dialog/LTO.png")}
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

        {/* Pedestrian */}
        {pedestrianVisible && (
          <Animated.Image
            source={isCrossing ? maleWalkSprites[maleFrame] : maleStandingSprite}
            style={{
              width: FRAME_WIDTH,
              height: FRAME_HEIGHT,
              position: "absolute",
              top: pedestrianRowIndex * tileSize + maleVerticalOffset,
              left: isCrossing ? maleCrossingXAnim : maleFixedLeft,
              zIndex: 6,
            }}
            resizeMode="contain"
          />
        )}
      </Animated.View>

      {/* Car - fixed */}
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
            source={require("../../../../assets/dialog/LTO.png")}
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
          <Image source={require("../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </View>
      )}

      {animationType === "wrong" && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
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
    //intro
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
  //end intro
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
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: height * 0.05,
  },
  questionTextContainer: {
    padding: width * 0.04,
    maxWidth: width * 0.6,
  },
  questionText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.4,
    right: sideMargin,
    width: width * 0.35,
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.02,
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
    bottom: height * 0.45,
    right: sideMargin,
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
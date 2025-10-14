import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, } from "react-native";
import { router } from 'expo-router';
import { useSession } from '../../../../contexts/SessionManager';
import { scale, fontSize, wp, hp } from '../../../../contexts/ResponsiveHelper';

const { width, height } = Dimensions.get("window");


// Responsive calculations
const spriteWidth = Math.min(width * 0.08, 64);
const spriteHeight = spriteWidth * 1.5;
const carWidth = spriteWidth * 5;
const carHeight = spriteHeight * 5;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;


// Map setup
const mapImage = require("../../../../../assets/map/map3.png");
const mapWidth = 320;
const mapHeight = 768;
const mapScale = width / mapWidth;
const scaledMapHeight = mapHeight * mapScale;


// Character sprites
const maleSprites = {
  WEST: [
    require("../../../../../assets/character/sprites/west/west_walk1.png"),
    require("../../../../../assets/character/sprites/west/west_walk2.png"),
    require("../../../../../assets/character/sprites/west/west_walk3.png"),
    require("../../../../../assets/character/sprites/west/west_walk4.png"),
  ],
  NORTH: [
    require("../../../../../assets/character/sprites/north/north_walk1.png"),
    require("../../../../../assets/character/sprites/north/north_walk2.png"),
    require("../../../../../assets/character/sprites/north/north_walk3.png"),
    require("../../../../../assets/character/sprites/north/north_walk4.png"),
  ],
};


// South facing cars
const npcCarSpritesSouth = {
  yellow: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/WEST/SEPARATED/Yellow_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/WEST/SEPARATED/Yellow_CIVIC_CLEAN_WEST_001.png"),
  ],
};


const questions = [
  {
    question: "You're jogging along a residential area at 5 AM. A car is backing out of a driveway directly into your jogging path, and the driver hasn't seen you yet.",
    options: [
      "Continue jogging since you have the right of way on the sidewalk",
      "Stop, make noise, and wait for the driver to notice you before proceeding",
      "Quickly run behind the car while it's still backing up"
    ],
    correct: "Stop, make noise, and wait for the driver to notice you before proceeding",
    wrongExplanation: {
      "Continue jogging since you have the right of way on the sidewalk": "Accident prone! Having the right of way doesn't guarantee your safety. Always be alert of your surroundings and make sure that the driver sees you before continuing",
      "Quickly run behind the car while it's still backing up": "Accident prone! Running behind the car while it's still backing up might not give enough time for the driver to notice you and run you over as a result."
    }
  },
];


export default function DrivingGame() {
  const {
    currentScenario,
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
  } = useSession();

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const scenarioId = 90 + currentScenario;
      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
    } catch (error) {
      console.error('Error updating scenario progress:', error);
    }
  };
  
  const [isPlayerVisible, setIsPlayerVisible] = useState(true);


  const startOffset = -(scaledMapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);


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
  const [playerDirection, setPlayerDirection] = useState("NORTH");


  // Player
  const [playerFrame, setPlayerFrame] = useState(0);
  const [playerPaused, setPlayerPaused] = useState(false);
  const centerX = width * 0.5 - spriteWidth / 2;
  const playerXAnim = useRef(new Animated.Value(centerX)).current;


  // Parked car on map - fixed position relative to map
  const [parkedCarFrame, setParkedCarFrame] = useState(0);
  const [parkedCarMapY] = useState(scaledMapHeight * 0.45); // Position on the map (45% down from top)
  const parkedCarOffsetX = useRef(new Animated.Value(0)).current; // Horizontal offset for backing out
  const [hasCarStartedBacking, setHasCarStartedBacking] = useState(false);
  const [isCarPaused, setIsCarPaused] = useState(false);
  const carAnimationRef = useRef(null); // Store animation reference


  // Function to pause car
  const pauseCar = () => {
    parkedCarOffsetX.stopAnimation();
  };

  // Function to reverse car back to driveway
  const reverseCarToDriveway = () => {
    Animated.timing(parkedCarOffsetX, {
      toValue: 0, // Return to starting position
      duration: 3000,
      useNativeDriver: true,
    }).start();
  };


  // Start parked car backing up animation when game starts
  useEffect(() => {
    if (!hasCarStartedBacking) {
      // Wait 2 seconds after game starts, then start backing up
      setTimeout(() => {
        setHasCarStartedBacking(true);
       
        // Animate car backing out horizontally (moving right into the road)
        carAnimationRef.current = Animated.timing(parkedCarOffsetX, {
          toValue: +width * 0.30, // Positive value moves right (backing into road)
          duration: 17000, // 17 seconds - very slow
          useNativeDriver: true,
        });
        carAnimationRef.current.start();
      }, 2000);
    }
  }, [hasCarStartedBacking]);


  // Animate parked car sprite frames
  useEffect(() => {
    const interval = setInterval(() => {
      setParkedCarFrame(prev => (prev + 1) % 2);
    }, 200);
    return () => clearInterval(interval);
  }, []);


  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopDistance = scaledMapHeight * 0.3;
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


  // Player sprite frame loop
  useEffect(() => {
    let iv;
    if (!playerPaused && maleSprites[playerDirection]) {
      iv = setInterval(() => {
        setPlayerFrame((p) => (p + 1) % maleSprites[playerDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [playerPaused, playerDirection]);


  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);


  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    if (answerGiven === currentQuestion.correct) {
      setIsCorrectAnswer(true);
      setAnimationType("correct");
      setTimeout(() => {
        setShowNext(true);
      }, 1000);
    } else {
      setIsCorrectAnswer(false);
      setAnimationType("wrong");
      setTimeout(() => {
        setShowNext(true);
      }, 1000);
    }
  };


  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    updateProgress(answer, isCorrect);
    
    if (answer === "Continue jogging since you have the right of way on the sidewalk") {
      // Continue running forward (north) - will collide with car
      setPlayerDirection("NORTH");
      setPlayerFrame(0);
     
      Animated.timing(scrollY, {
        toValue: currentScroll.current + scaledMapHeight * 0.1,
        duration: 1000, // Fast running
        useNativeDriver: true,
      }).start(() => {
        setIsPlayerVisible(false);
        handleFeedback(answer);
      });
     
      return;
    } else if (answer === "Stop, make noise, and wait for the driver to notice you before proceeding") {
      // Stop and wait (stay in place)
      setPlayerDirection("NORTH");
      setPlayerPaused(true);
      setPlayerFrame(0);
      
      // PAUSE THE CAR
      pauseCar();
      
      // Wait 1 second, then car notices and reverses back
      setTimeout(() => {
        reverseCarToDriveway(); // Car goes back to driveway
      }, 1000);
     
      // Wait for car to return, then player continues
      setTimeout(() => {
        setPlayerPaused(false);
        Animated.timing(scrollY, {
          toValue: currentScroll.current + scaledMapHeight * 0.08,
          duration: 2000, // Normal walking
          useNativeDriver: true,
        }).start(() => {
          setIsPlayerVisible(false);
          handleFeedback(answer);
        });
      }, 4000); // Wait 4 seconds (1s pause + 3s for car to reverse)
     
      return;
    } else if (answer === "Quickly run behind the car while it's still backing up") {
      // Run behind the car
      setPlayerDirection("NORTH");
      setPlayerFrame(0);
     
      Animated.timing(scrollY, {
        toValue: currentScroll.current + scaledMapHeight * 0.07,
        duration: 800, // Quick movement
        useNativeDriver: true,
      }).start(() => {
        setIsPlayerVisible(false);
        handleFeedback(answer);
      });
     
      return;
    }
  };


  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setPlayerFrame(0);
   
    const centerX = width * 0.5 - spriteWidth / 2;
    playerXAnim.setValue(centerX);
    setPlayerDirection("NORTH");
    setIsPlayerVisible(true);
    setPlayerPaused(false);
    setHasCarStartedBacking(false);
    parkedCarOffsetX.setValue(0);
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario >= 10) {

      try {
        const sessionResults = await completeSession();

        if (!sessionResults) {
          Alert.alert('Error', 'Failed to complete session');
          return;
        }

        router.push({
          pathname: '/result-page',
          params: {
            ...sessionResults,
            userAttempts: JSON.stringify(sessionResults.attempts)
          }
        });
      } catch (error) {
        console.error('Error completing session:', error);
        Alert.alert('Error', 'Failed to save session results');
      }
    } else {
      // Move to next scenario
       moveToNextScenario();
       const nextScreen = `S${currentScenario + 1}P1`;
       router.push(`/scenarios/pedestrian/phase1/${nextScreen}`);
    }
  };


  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Stay completely alert, you'll never know when a vehicle doesn't respect road markings."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";


  const currentPlayerSprite = maleSprites[playerDirection] && maleSprites[playerDirection][playerFrame]
    ? maleSprites[playerDirection][playerFrame]
    : maleSprites["NORTH"][0];


  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Map */}
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


        {/* Parked car - positioned ON the map */}
        <Animated.View
          style={{
            position: "absolute",
            left: width * 0.15, // Position on map (15% from left)
            top: parkedCarMapY, // Fixed position on map
            width: carWidth,
            height: carHeight,
            transform: [{ translateX: parkedCarOffsetX }], // Backing out animation (horizontal)
          }}
        >
          <Image
            source={npcCarSpritesSouth.yellow[parkedCarFrame]}
            style={{
              width: carWidth,
              height: carHeight,
            }}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>


      {/* Player sprite */}
      {isPlayerVisible && (
        <Animated.Image
          source={currentPlayerSprite}
          style={{
            width: spriteWidth * 1.5,
            height: spriteHeight * 1.5,
            position: "absolute",
            bottom: 80,
            transform: [{ translateX: playerXAnim }],
            zIndex: 8,
          }}
        />
      )}


      {/* Question overlay */}
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
          {questions[questionIndex].options.map((answer) => (
            <TouchableOpacity
              key={answer}
              style={styles.answerButton}
              onPress={() => handleAnswer(answer)}
            >
              <Text style={styles.answerText}>{answer}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}


      {/* Feedback */}
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


      {/* Next button */}
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
    fontSize: fontSize(16),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.16,
    right: sideMargin,
    width: wp(30),
    height: height * 0.21,
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.015,
    borderRadius: scale(8),
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
    width: wp(100),
    height: hp(35),
    backgroundColor: "rgba(8, 8, 8, 0.43)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: scale(10),
    zIndex: 10,
  },
  feedbackBox: {
    flex: 1,
    bottom: hp(10),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(15),
  },
  feedbackText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: fontSize(22),
  },
  nextButtonContainer: {
    position: "absolute",
    top: hp(50),
    right: wp(5),
    width: wp(20),
    alignItems: "center",
    zIndex: 11,
  },
  nextButton: {
    backgroundColor: "#007bff",
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: wp(15),
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "bold",
  },
});
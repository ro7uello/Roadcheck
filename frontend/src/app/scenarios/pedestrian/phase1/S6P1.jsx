import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, } from "react-native";
import { router } from 'expo-router';
import { useSession } from '../../../../contexts/SessionManager';


const { width, height } = Dimensions.get("window");


// Responsive calculations
const spriteWidth = Math.min(width * 0.08, 64);
const spriteHeight = spriteWidth * 1.5;
const carWidth = spriteWidth * 5; // Make cars bigger
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


// NPC standing sprites (alternating between north and west)
const npcStandingSprites = [
  require("../../../../../assets/character/sprites/north/north_walk1.png"),
  require("../../../../../assets/character/sprites/west/west_walk1.png"),
];


// Multiple car colors - North facing
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


// South facing cars
const npcCarSpritesSouth = {
  blue: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTH/SEPARATED/Blue_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTH/SEPARATED/Blue_CIVIC_CLEAN_SOUTH_001.png"),
  ],
  red: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/SOUTH/SEPARATED/Red_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/SOUTH/SEPARATED/Red_CIVIC_CLEAN_SOUTH_001.png"),
  ],
  green: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/SOUTH/SEPARATED/Green_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/SOUTH/SEPARATED/Green_CIVIC_CLEAN_SOUTH_001.png"),
  ],
  yellow: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/SOUTH/SEPARATED/Yellow_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/SOUTH/SEPARATED/Yellow_CIVIC_CLEAN_SOUTH_001.png"),
  ],
};


const questions = [
  {
    question: "You're walking around BGC when you suddenly see that the sidewalk is occupied by restaurants and people. There's another 50 meters before the sidewalk clears.",
    options: [
      "Walk on the side of the road facing oncoming traffic.",
      "Walk on the side of the road with the traffic",
      "Find alternative route."
    ],
    correct: "Walk on the side of the road facing oncoming traffic.",
    wrongExplanation: {
      "Walk on the side of the road with the traffic.": "Wrong! Walking on the side of the road in the same direction of the traffic might stop you from reacting to vehicles coming too close.",
      "Find alternative route.": "Wrong! While cautious, this takes up too much time."
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


  // NPC Cars - Initial state with refs
  const carsRef = useRef([
    // Column 1 cars (SOUTH facing - moving down)
    { id: 1, color: 'blue', column: 1, direction: 'SOUTH', yOffset: 100, frame: 0 },
    { id: 2, color: 'red', column: 1, direction: 'SOUTH', yOffset: -200, frame: 0 },
    { id: 3, color: 'green', column: 1, direction: 'SOUTH', yOffset: -500, frame: 0 },
    // Column 2 cars (NORTH facing - moving up)
    { id: 4, color: 'yellow', column: 2, direction: 'NORTH', yOffset: -150, frame: 0 },
    { id: 5, color: 'blue', column: 2, direction: 'NORTH', yOffset: -450, frame: 0 },
    { id: 6, color: 'red', column: 2, direction: 'NORTH', yOffset: -750, frame: 0 },
  ]);


  const [npcCars, setNpcCars] = useState(carsRef.current);


  // NPC People - Standing on sidewalk blocking the path
  // Fixed positions on the map (will scroll with the map)
  const npcPeopleMapPositions = [
    { id: 1, mapY: scaledMapHeight * 0.45, spriteIndex: 0 },
    { id: 2, mapY: scaledMapHeight * 0.47, spriteIndex: 1 },
    { id: 3, mapY: scaledMapHeight * 0.49, spriteIndex: 0 },
    { id: 4, mapY: scaledMapHeight * 0.51, spriteIndex: 1 },
    { id: 5, mapY: scaledMapHeight * 0.53, spriteIndex: 0 },
    { id: 6, mapY: scaledMapHeight * 0.43, spriteIndex: 1 },
  ];


  // Animate NPC cars moving forward slowly with the map
  useEffect(() => {
    const carUpdateInterval = setInterval(() => {
      carsRef.current = carsRef.current.map(car => {
        let newYOffset;
       
        if (car.direction === 'NORTH') {
          // North facing cars move up (negative Y)
          newYOffset = car.yOffset - 2;
          // Reset when off top of screen
          if (newYOffset < -200) {
            newYOffset = height + 200;
          }
        } else {
          // South facing cars move down (positive Y)
          newYOffset = car.yOffset + 2;
          // Reset when off bottom of screen
          if (newYOffset > height + 200) {
            newYOffset = -200;
          }
        }
       
        return {
          ...car,
          yOffset: newYOffset,
          frame: (car.frame + 1) % 2
        };
      });
     
      setNpcCars([...carsRef.current]);
    }, 50); // Update every 50ms for smooth movement


    return () => clearInterval(carUpdateInterval);
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
    setPlayerPaused(false); // Enable walking animation


    // Capture current scroll value at the moment of answer
    const scrollAtAnswer = currentScroll.current;


    if (answer === "Walk on the side of the road facing oncoming traffic.") {
      // OPTION 1 (CORRECT): Walk to the left side facing oncoming traffic
      setPlayerDirection("WEST");
      setPlayerFrame(0);
     
      const leftX = width * 0.15 - spriteWidth / 2;
      const targetScroll = scrollAtAnswer + scaledMapHeight * 0.08;
     
      Animated.parallel([
        Animated.timing(playerXAnim, {
          toValue: leftX,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: targetScroll,
          duration: 2000,
          useNativeDriver: true,
        })
      ]).start(() => {
        setPlayerPaused(true);
        handleFeedback(answer);
      });
     
      return;
    } else if (answer === "Walk on the side of the road with the traffic") {
      // OPTION 2 (WRONG): Walk on right side WITH traffic (same direction as cars)
      setPlayerDirection("NORTH");
      setPlayerFrame(0);
     
      const rightX = width * 0.70 - spriteWidth / 2;
      const targetScroll = scrollAtAnswer + scaledMapHeight * 0.08;
     
      // Move diagonally to the right side while moving forward
      Animated.parallel([
        Animated.timing(playerXAnim, {
          toValue: rightX,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: targetScroll,
          duration: 2000,
          useNativeDriver: true,
        })
      ]).start(() => {
        setPlayerPaused(true);
        handleFeedback(answer);
      });
     
      return;
    } else if (answer === "Find alternative route.") {
      // OPTION 3 (WRONG): Turn around and go back
      setPlayerDirection("WEST");
      setPlayerFrame(0);
     
      const leftX = centerX - spriteWidth * 2;
     
      // First move left (west)
      Animated.timing(playerXAnim, {
        toValue: leftX,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // Then walk backwards (scroll down)
        const targetScroll = scrollAtAnswer - scaledMapHeight * 0.05;
        Animated.timing(scrollY, {
          toValue: targetScroll,
          duration: 1500,
          useNativeDriver: true,
        }).start(() => {
          setPlayerPaused(true);
          handleFeedback(answer);
        });
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


  // Calculate car positions based on columns
  const getCarXPosition = (column) => {
    if (column === 1) {
      return width * 0.25; // Column 1 (left lane)
    } else {
      return width * 0.45; // Column 2 (middle-left lane)
    }
  };


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


        {/* NPC People - Positioned on the map, will scroll with it */}
        {npcPeopleMapPositions.map(person => (
          <View
            key={person.id}
            style={{
              position: "absolute",
              left: width * 0.50 - (spriteWidth * 1.5) / 2,
              top: person.mapY,
              width: spriteWidth * 1.5,
              height: spriteHeight * 1.5,
            }}
          >
            <Image
              source={npcStandingSprites[person.spriteIndex]}
              style={{
                width: spriteWidth * 1.5,
                height: spriteHeight * 1.5,
              }}
              resizeMode="contain"
            />
          </View>
        ))}
      </Animated.View>


      {/* NPC Cars - Fixed positioning */}
      {npcCars.map(car => {
        const carSprites = car.direction === 'SOUTH' ? npcCarSpritesSouth : npcCarSprites;
        return (
          <View
            key={car.id}
            style={{
              position: "absolute",
              left: getCarXPosition(car.column) - (carWidth / 1),
              top: car.yOffset,
              width: carWidth,
              height: carHeight,
              zIndex: 5,
            }}
          >
            <Image
              source={carSprites[car.color][car.frame]}
              style={{
                width: carWidth,
                height: carHeight,
              }}
              resizeMode="contain"
            />
          </View>
        );
      })}


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
    fontSize: Math.min(width * 0.04, 16),
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


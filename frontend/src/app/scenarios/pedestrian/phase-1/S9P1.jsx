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
const spriteWidth = Math.min(width * 0.08, 64);
const spriteHeight = spriteWidth * 1.5;
const carWidth = spriteWidth * 5;
const carHeight = spriteHeight * 5;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Map setup
const mapImage = require("../../../../../assets/map/map1.png");
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

// Sober friend sprites (same as male sprites)
const friendSprites = {
  WEST: [
    require("../../../../../assets/character/sprites/west/west_walk1.png"),
    require("../../../../../assets/character/sprites/west/west_walk2.png"),
    require("../../../../../assets/character/sprites/west/west_walk3.png"),
    require("../../../../../assets/character/sprites/west/west_walk4.png"),
  ],
};

// Multiple car colors
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
    question: "You've been drinking at a friend's birthday party and feel slightly dizzy as you went outside. You are planning to cross the street. The designated crossing is 50 meters away.",
    options: [
      "Cross immediately while you still feel okay",
      "Wait to sober up completely before attempting to cross",
      "Ask a sober friend to help guide you to the proper crossing"
    ],
    correct: "Ask a sober friend to help guide you to the proper crossing",
    wrongExplanation: {
      "Cross immediately while you still feel okay": "Wrong! Any alcohol impairment affects judgment and reaction time and might get you to unexpected accidents.",
      "Wait to sober up completely before attempting to cross": "Not practical! While not crossing impaired is good, waiting outside is not safe nor is practical."
    }
  },
];

export default function DrivingGame() {
  const [isPlayerVisible, setIsPlayerVisible] = useState(true);
  const [isFriendVisible, setIsFriendVisible] = useState(false);

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

  // Friend
  const [friendFrame, setFriendFrame] = useState(0);
  const [friendDirection, setFriendDirection] = useState("WEST");
  const friendXAnim = useRef(new Animated.Value(centerX + spriteWidth * 2)).current;

  // NPC Cars - Initial state with refs
  const carsRef = useRef([
    { id: 1, color: 'blue', column: 1, yOffset: 0, frame: 0 },
    { id: 2, color: 'red', column: 1, yOffset: -300, frame: 0 },
    { id: 3, color: 'green', column: 1, yOffset: -600, frame: 0 },
    { id: 4, color: 'yellow', column: 2, yOffset: -150, frame: 0 },
    { id: 5, color: 'blue', column: 2, yOffset: -450, frame: 0 },
    { id: 6, color: 'red', column: 2, yOffset: -750, frame: 0 },
  ]);

  const [npcCars, setNpcCars] = useState(carsRef.current);

  // Animate NPC cars
  useEffect(() => {
    const carUpdateInterval = setInterval(() => {
      carsRef.current = carsRef.current.map(car => {
        let newYOffset = car.yOffset - 2;
        
        if (newYOffset > height + 200) {
          newYOffset = -200;
        }
        
        return {
          ...car,
          yOffset: newYOffset,
          frame: (car.frame + 1) % 2
        };
      });
      
      setNpcCars([...carsRef.current]);
    }, 50);

    return () => clearInterval(carUpdateInterval);
  }, []);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopDistance = scaledMapHeight * 0.2;
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

  // Friend sprite frame loop
  useEffect(() => {
    let iv;
    if (isFriendVisible && friendSprites[friendDirection]) {
      iv = setInterval(() => {
        setFriendFrame((p) => (p + 1) % friendSprites[friendDirection].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [isFriendVisible, friendDirection]);

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

    if (answer === "Cross immediately while you still feel okay") {
      // Player runs west alone and gets hit
      setPlayerDirection("WEST");
      setPlayerFrame(0);
      
      const leftX = width * 0.15 - spriteWidth / 2;
      
      Animated.parallel([
        Animated.timing(playerXAnim, {
          toValue: leftX,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: currentScroll.current + scaledMapHeight * 0.05,
          duration: 1200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsPlayerVisible(false);
        handleFeedback(answer);
      });
      
      return;
    } else if (answer === "Wait to sober up completely before attempting to cross") {
      // Player just waits (minimal animation)
      setPlayerPaused(true);
      
      setTimeout(() => {
        handleFeedback(answer);
      }, 1500);
      
      return;
    } else if (answer === "Ask a sober friend to help guide you to the proper crossing") {
      // Sober friend appears and both walk west together safely
      setIsFriendVisible(true);
      setPlayerDirection("WEST");
      setFriendDirection("WEST");
      setPlayerFrame(0);
      setFriendFrame(0);
      
      const playerLeftX = width * 0.15 - spriteWidth / 2;
      const friendLeftX = playerLeftX + spriteWidth * .5;
      
      
      Animated.parallel([
        Animated.timing(playerXAnim, {
          toValue: playerLeftX,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(friendXAnim, {
          toValue: friendLeftX,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: currentScroll.current + scaledMapHeight * 0.15,
          duration: 3000,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsPlayerVisible(false);
        setIsFriendVisible(false);
        handleFeedback(answer);
      });
      
      return;
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setPlayerFrame(0);
    
    const centerX = width * 0.5 - spriteWidth / 2;
    playerXAnim.setValue(centerX);
    friendXAnim.setValue(centerX + spriteWidth * 2);
    setPlayerDirection("NORTH");
    setFriendDirection("WEST");
    setIsPlayerVisible(true);
    setIsFriendVisible(false);
    setPlayerPaused(false);
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/scenarios/pedestrian/phase-1/S9P1');
      setQuestionIndex(0);
      setShowQuestion(false);
    }
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Always ask for help from a sober friend when you're impaired. They can guide you to a safe crossing and ensure your safety."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  const currentPlayerSprite = maleSprites[playerDirection] && maleSprites[playerDirection][playerFrame] 
    ? maleSprites[playerDirection][playerFrame] 
    : maleSprites["NORTH"][0];

  const currentFriendSprite = friendSprites[friendDirection] && friendSprites[friendDirection][friendFrame]
    ? friendSprites[friendDirection][friendFrame]
    : friendSprites["WEST"][0];

  const getCarXPosition = (column) => {
    if (column === 1) {
      return width * 0.25;
    } else {
      return width * 0.45;
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
      </Animated.View>

      {/* NPC Cars */}
      {npcCars.map(car => (
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
            source={npcCarSprites[car.color][car.frame]}
            style={{
              width: carWidth,
              height: carHeight,
            }}
            resizeMode="contain"
          />
        </View>
      ))}

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

      {/* Friend sprite */}
      {isFriendVisible && (
        <Animated.Image
          source={currentFriendSprite}
          style={{
            width: spriteWidth * 1.5,
            height: spriteHeight * 1.5,
            position: "absolute",
            bottom: 80,
            transform: [{ translateX: friendXAnim }],
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
          {questions[questionIndex].options.map((option, index) => (
            <TouchableOpacity
              key={option}
              style={styles.answerButton}
              onPress={() => handleAnswer(option)}
            >
              <Text style={styles.answerText}>
                {String.fromCharCode(65 + index)}. {option}
              </Text>
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
    width: width * 0.4,
    height: height * 0.3,
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.018,
    borderRadius: 8,
    marginBottom: height * 0.015,
    borderWidth: 1,
    borderColor: "#555",
  },
  answerText: {
    color: "white",
    fontSize: Math.min(width * 0.035, 14),
    textAlign: "left",
    lineHeight: Math.min(width * 0.045, 18),
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
    fontSize: Math.min(width * 0.05, 22),
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: width * 0.05,
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
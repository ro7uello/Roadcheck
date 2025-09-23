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

// Responsive calculations - Larger cars (increased size)
const carWidth = Math.min(width * 0.25, 150); // Increased from 0.18 to 0.25
const carHeight = carWidth * (350/280);
const overlayTop = height * 0.4;
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
  road60: require("../../../../assets/road/road60.png"),
  int1: require("../../../../assets/road/int1.png"),
  int2: require("../../../../assets/road/int2.png"),
  int3: require("../../../../assets/road/int3.png"),
  int4: require("../../../../assets/road/int4.png"),
};

const mapLayout = [
  ["road18", "road4", "road3", "road17", "road20"], // Row 0
  ["road18", "road4", "road3", "road17", "road20"], // Row 1
  ["road18", "road4", "road3", "road17", "road20"], // Row 2
  ["road18", "road4", "road3", "road17", "road20"], // Row 3
  ["road18", "road4", "road3", "road17", "road20"], // Row 4
  ["road18", "road4", "road3", "road17", "road20"], // Row 5
  ["road49", "road59", "road57", "road50", "road52"], // Row 6 - Brown stops here (road57, col 2)
  ["road60", "int3", "int4", "road60", "road24"], // Row 7 - Red stops here (int4, col 2)
  ["road58", "int2", "int1", "road58", "road23"], // Row 8
  ["road19", "road59", "road57", "road16", "road51"], // Row 9
  ["road18", "road4", "road3", "road17", "road20"], // Row 10 - Blue stops here initially (road3, col 2)
  ["road18", "road4", "road3", "road17", "road20"], // Row 11
  ["road18", "road4", "road3", "road17", "road20"], // Row 12
  ["road18", "road4", "road3", "road17", "road20"], // Row 13
  ["road18", "road4", "road3", "road17", "road20"], // Row 14
  ["road18", "road4", "road3", "road17", "road20"], // Row 15
  ["road18", "road4", "road3", "road17", "road20"], // Row 16
  ["road18", "road4", "road3", "road17", "road20"], // Row 17
];

const carSprites = {
  blue: {
    NORTH: [
      require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
      require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
    ],
  },
  brown: {
    NORTH: [
      require("../../../../assets/car/CIVIC TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_CIVIC_CLEAN_NORTH_000.png"),
      require("../../../../assets/car/CIVIC TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_CIVIC_CLEAN_NORTH_001.png"),
    ],
  },
  red: {
    NORTH: [
      require("../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_000.png"),
      require("../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_001.png"),
    ],
  },
};

// Traffic light sprites
const trafficLightSprites = {
  normal: require("../../../../assets/traffic light/traffic_light_green2.png"),
  yellow: require("../../../../assets/traffic light/traffic_light_yellow2.png"),
  red: require("../../../../assets/traffic light/traffic_light_red2.png"),
};

const questions = [
  {
    question: "You're approaching a busy intersection in Makati\n" +
              "with a yellow box \"Do Not Block\" marking.\n" +
              "Traffic ahead is slow, and you might get stuck\n" +
              "in the box when the light changes.",
    options: [
      "Enter the yellow box since you have a green light", 
      "Wait outside the yellow box until you can completely clear it", 
      "Enter partially and move forward when space becomes available"
    ],
    correct: "Wait outside the yellow box until you can completely clear it",
    wrongExplanation: {
      "Enter the yellow box since you have a green light": "Wrong! Green lights don't override the \"Do Not Block\" rule - you must not enter unless you can exit completely.",
      "Enter partially and move forward when space becomes available": "Wrong! Partial entry still blocks the intersection for cross traffic when lights change."
    },
    correctExplanation: "Correct! You must wait until you can completely clear the yellow box before entering, regardless of light color."
  }
];

export default function DrivingGame() {
  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  // Camera following blue car - starts centered on blue car's initial position
  const cameraY = useRef(new Animated.Value(0)).current;
  
  // Individual car world positions (absolute positions in the map)
  const brownCarWorldY = useRef(new Animated.Value(mapHeight + 100)).current; // Start off-screen
  const redCarWorldY = useRef(new Animated.Value(mapHeight + 200)).current; // Start off-screen
  const blueCarWorldY = useRef(new Animated.Value(mapHeight + 300)).current; // Start off-screen (furthest)

  // Car visibility states
  const [carVisibility, setCarVisibility] = useState({
    brown: false,
    red: false,
    blue: false
  });

  // All cars use column 2 (road3/road57/int4)
  const carX = 2 * tileSize + (tileSize - carWidth) / 2;

  // Car frame states for animation
  const [carFrames, setCarFrames] = useState({
    brown: 0,
    red: 0,
    blue: 0
  });

  // State management
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [trafficLightState, setTrafficLightState] = useState('normal');
  const [gamePhase, setGamePhase] = useState('opening'); // opening, question, answering, completed

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Car frame animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCarFrames(prev => ({
        brown: (prev.brown + 1) % 2,
        red: (prev.red + 1) % 2,
        blue: (prev.blue + 1) % 2
      }));
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Camera follows blue car
  const updateCamera = (blueCarPosition) => {
    const targetCameraY = -(blueCarPosition - height / 2);
    // Smooth camera movement
    Animated.timing(cameraY, {
      toValue: targetCameraY,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  // Track blue car position for camera following
  useEffect(() => {
    const listener = blueCarWorldY.addListener(({ value }) => {
      updateCamera(value);
    });
    return () => blueCarWorldY.removeListener(listener);
  }, []);

  // Opening sequence - cars appear one by one
  useEffect(() => {
    if (gamePhase === 'opening') {
      console.log('Starting opening sequence');
      
      // Step 1: Brown car appears and moves to row 6, column 2 (road57)
      setTimeout(() => {
        console.log('Brown car appearing');
        setCarVisibility(prev => ({ ...prev, brown: true }));
        Animated.timing(brownCarWorldY, {
          toValue: 6 * tileSize + (tileSize - carHeight) / 2, // Row 6 (road57)
          duration: 2500,
          useNativeDriver: false,
        }).start(() => {
          console.log('Brown car reached destination');
        });
      }, 500);

      // Step 2: Red car appears and moves to row 7, column 2 (int4)
      setTimeout(() => {
        console.log('Red car appearing');
        setCarVisibility(prev => ({ ...prev, red: true }));
        Animated.timing(redCarWorldY, {
          toValue: 7 * tileSize + (tileSize - carHeight) / 2, // Row 7 (int4)
          duration: 2500,
          useNativeDriver: false,
        }).start(() => {
          console.log('Red car reached destination');
        });
      }, 1500);

      // Step 3: Blue car (user) appears and moves to row 10, column 2 (road3)
      setTimeout(() => {
        console.log('Blue car appearing');
        setCarVisibility(prev => ({ ...prev, blue: true }));
        Animated.timing(blueCarWorldY, {
          toValue: 10 * tileSize + (tileSize - carHeight) / 2, // Row 10 (road3)
          duration: 2500,
          useNativeDriver: false,
        }).start(() => {
          console.log('Blue car reached destination, starting question phase');
          setGamePhase('question');
          setTimeout(() => {
            setShowQuestion(true);
            setTimeout(() => {
              setShowAnswers(true);
            }, 1000);
          }, 1000);
        });
      }, 2500);
    }
  }, [gamePhase]);

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);
    setGamePhase('answering');

    if (answer === "Enter the yellow box since you have a green light") {
      // Option 1: Blue car moves into int4 area (wrong choice)
      Animated.timing(blueCarWorldY, {
        toValue: 7.5 * tileSize + (tileSize - carHeight) / 2, // Move into intersection area
        duration: 2000,
        useNativeDriver: false,
      }).start(() => {
        setTimeout(() => {
          handleFeedback(answer);
        }, 500);
      });
      
    } else if (answer === "Wait outside the yellow box until you can completely clear it") {
      // Option 2: Brown and red cars move away first, then blue proceeds (correct)
      setTimeout(() => {
        // Move brown and red cars out of the way
        const clearAnimations = [
          Animated.timing(brownCarWorldY, {
            toValue: 3 * tileSize + (tileSize - carHeight) / 2, // Move brown car further north
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(redCarWorldY, {
            toValue: 4 * tileSize + (tileSize - carHeight) / 2, // Move red car further north
            duration: 1500,
            useNativeDriver: false,
          })
        ];
        
        Animated.parallel(clearAnimations).start(() => {
          // Now blue car can proceed completely through
          Animated.timing(blueCarWorldY, {
            toValue: 6.5 * tileSize + (tileSize - carHeight) / 2, // Move through intersection safely
            duration: 2000,
            useNativeDriver: false,
          }).start(() => {
            setTimeout(() => {
              handleFeedback(answer);
            }, 500);
          });
        });
      }, 1000);
      
    } else if (answer === "Enter partially and move forward when space becomes available") {
      // Option 3: Blue car moves partially into intersection area (wrong choice)
      Animated.timing(blueCarWorldY, {
        toValue: 8.5 * tileSize + (tileSize - carHeight) / 2, // Partial entry into intersection
        duration: 1500,
        useNativeDriver: false,
      }).start(() => {
        setTimeout(() => {
          handleFeedback(answer);
        }, 500);
      });
    }
  };

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

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setGamePhase('question');
    } else {
      setGamePhase('completed');
      router.push('/driver-game/road-markings/phase2/s5p2');
    }
  };

  // Calculate traffic light position in world coordinates
  const trafficLightWorldX = 2 * tileSize - 30;
  const trafficLightWorldY = 8.5 * tileSize;

  // Feedback message
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? currentQuestionData.correctExplanation
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

  // Yellow box (Do Not Block marking) - World coordinates
  const renderYellowBox = () => (
    <View
      style={{
        position: "absolute",
        left: 2 * tileSize + 5,
        top: 7 * tileSize + 5,
        width: tileSize - 10,
        height: tileSize * 2 - 10,
        backgroundColor: "rgba(255, 255, 0, 0.3)",
        borderWidth: 4,
        borderColor: "yellow",
        borderStyle: "dashed",
        zIndex: 3,
      }}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Map with camera following */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: mapHeight,
          left: 0,
          transform: [{ translateY: cameraY }],
          zIndex: 1,
        }}
      >
        {/* Road tiles */}
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
        
        {/* Yellow Box */}
        {renderYellowBox()}
        
        {/* Traffic Light */}
        <Image
          source={trafficLightSprites[trafficLightState]}
          style={{
            width: tileSize * 1.5,
            height: tileSize * 2,
            position: "absolute",
            top: trafficLightWorldY,
            left: trafficLightWorldX,
            zIndex: 10,
          }}
          resizeMode="contain"
        />

        {/* Cars in world space */}
        {carVisibility.brown && (
          <Animated.Image
            source={carSprites.brown.NORTH[carFrames.brown]}
            style={{
              width: carWidth,
              height: carHeight,
              position: "absolute",
              left: carX,
              top: brownCarWorldY,
              zIndex: 7,
            }}
            resizeMode="contain"
          />
        )}

        {carVisibility.red && (
          <Animated.Image
            source={carSprites.red.NORTH[carFrames.red]}
            style={{
              width: carWidth,
              height: carHeight,
              position: "absolute",
              left: carX,
              top: redCarWorldY,
              zIndex: 6,
            }}
            resizeMode="contain"
          />
        )}

        {carVisibility.blue && (
          <Animated.Image
            source={carSprites.blue.NORTH[carFrames.blue]}
            style={{
              width: carWidth,
              height: carHeight,
              position: "absolute",
              left: carX,
              top: blueCarWorldY,
              zIndex: 5,
            }}
            resizeMode="contain"
          />
        )}
      </Animated.View>

      {/* Debug info - Remove in production */}
      <View style={{
        position: 'absolute',
        top: 50,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10,
        zIndex: 100
      }}>
        <Text style={{ color: 'white', fontSize: 12 }}>
          Phase: {gamePhase}
        </Text>
        <Text style={{ color: 'white', fontSize: 12 }}>
          Brown: {Math.round(brownCarWorldY._value)}, Red: {Math.round(redCarWorldY._value)}, Blue: {Math.round(blueCarWorldY._value)}
        </Text>
        <Text style={{ color: 'white', fontSize: 12 }}>
          Camera: {Math.round(cameraY._value)}
        </Text>
        <Text style={{ color: 'white', fontSize: 12 }}>
          Visible: B:{carVisibility.brown ? 'Y' : 'N'}, R:{carVisibility.red ? 'Y' : 'N'}, Bl:{carVisibility.blue ? 'Y' : 'N'}
        </Text>
      </View>

      {/* Question Overlay */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image
            source={require("../../../../assets/dialog/Dialog.png")}
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

      {/* Answer Options */}
      {showAnswers && (
        <View style={styles.answersContainer}>
          {questions[questionIndex].options.map((option, index) => (
            <TouchableOpacity
              key={index}
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
          <Image source={require("../../../../assets/dialog/Dialog w answer.png")} style={styles.ltoImage} />
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
    paddingBottom: height * 0.05,
  },
  questionTextContainer: {
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
    top: height * 0.25,
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
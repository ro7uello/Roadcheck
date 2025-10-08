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
    road1: require("../../../../assets/road/road1.png"),
    road93: require("../../../../assets/road/road93.png"),
    road94: require("../../../../assets/road/road94.png"),
    toll1: require("../../../../assets/road/tollgate1.png"),
    toll2: require("../../../../assets/road/tollgate2.png"),
    toll3: require("../../../../assets/road/tollgate3.png"),

    "tollgate1-1": require("../../../../assets/road/tollgate1-1.png"),
    "tollgate1-2": require("../../../../assets/road/tollgate1-2.png"),
    "tollgate3-1": require("../../../../assets/road/tollgate3-1.png"),
    "tollgate3-2": require("../../../../assets/road/tollgate3-2.png"),
};

const mapLayout = [
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road94", "road94", "road94", "road94", "road94"],
  ["toll1", "toll1", "toll1", "toll2", "toll3"],
  ["road93", "road93", "road93", "road93", "road93"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
  ["road1", "road1", "road1", "road1", "road1"],
];

const carSprites = {
  NORTH: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHEAST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
  SOUTHEAST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTHEAST/SEPARATED/Blue_CIVIC_CLEAN_SOUTHEAST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTHEAST/SEPARATED/Blue_CIVIC_CLEAN_SOUTHEAST_001.png"),
  ],
  SOUTH: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTH/SEPARATED/Blue_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTH/SEPARATED/Blue_CIVIC_CLEAN_SOUTH_001.png"),
  ],
};

const npcCarSprites = {
  NORTH: [
    require("../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_001.png"),
  ],
};


const questions = [
  {
    question: "You're approaching the SLEX toll plaza and see a TOLL CHARGES sign showing: Motorcycles ₱20, Cars ₱180, Buses ₱360. You're driving a car but only have ₱150 cash and no RFID.",
    options: ["Proceed to a cash lane and explain your situation to the toll operator", "Turn around and exit the expressway before the toll plaza", "Follow another vehicle through the toll gate quickly"],
    correct: "Proceed to a cash lane and explain your situation to the toll operator",
    wrongExplanation: {
      "Turn around and exit the expressway before the toll plaza": "Wrong! Turning around near toll plazas is usually impossible and illegal due to expressway design and traffic flow patterns.",
      "Follow another vehicle through the toll gate quickly": "Accident Prone! Following another vehicle through toll gates without paying is illegal toll evasion and can result in fines and legal consequences."
    }
  },
  // Add more questions here as needed
];

export default function DrivingGame() {
  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isCarVisible, setIsCarVisible] = useState(true);
  const [tollgate1Open, setTollgate1Open] = useState(false);
  const [tollgate3Open, setTollgate3Open] = useState(false);
  const [currentMapLayout, setCurrentMapLayout] = useState(mapLayout);

  const startOffset = -(mapHeight - height);
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
  const [carDirection, setCarDirection] = useState("NORTH");

  // Car
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const carXAnim = useRef(new Animated.Value(width / 2 - carWidth / 2)).current;

  // NPC Car - stationary at row 7
  const [npcCarFrame, setNpcCarFrame] = useState(0);
  const [showNpcCar, setShowNpcCar] = useState(true);
  const npcCarYAnim = useRef(new Animated.Value(0)).current;

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    const stopRow = 8;
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

  // Calculate NPC car position relative to map scroll
  const calculateNpcCarPosition = () => {
    const npcCarRow = 9;
    const npcCarAbsoluteY = npcCarRow * tileSize;
    const relativeY = npcCarAbsoluteY + currentScroll.current + startOffset;
    return relativeY;
  };

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

  // NPC Car sprite frame loop
  useEffect(() => {
    let iv;
    if (showNpcCar) {
      iv = setInterval(() => {
        setNpcCarFrame((p) => (p + 1) % npcCarSprites["NORTH"].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [showNpcCar]);

  // Update map tiles when tollgates open
  useEffect(() => {
    const newLayout = mapLayout.map((row, rowIndex) => 
      row.map((tile, colIndex) => {
        // Middle tollgate (column 1) - starts closed
        if (rowIndex === 6 && colIndex === 2) {
          if (tile === "toll1" || tile === "tollgate1-1" || tile === "tollgate1-2") {
            if (tollgate1Open) return "tollgate1-2"; // Fully open
            return "toll1"; // Closed
          }
        }
        // Rightmost tollgate (column 4) - starts closed
        if (rowIndex === 6 && colIndex === 4) {
          if (tile === "toll3" || tile === "tollgate3-1" || tile === "tollgate3-2") {
            if (tollgate3Open) return "tollgate3-2"; // Fully open
            return "toll3"; // Closed
          }
        }
        return tile;
      })
    );
    setCurrentMapLayout(newLayout);
  }, [tollgate1Open, tollgate3Open]);

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

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);

    if (answer === "Proceed to a cash lane and explain your situation to the toll operator") {
      // Move forward first
      const moveToRow = 8;
      const initialScrollTarget = currentScroll.current + (moveToRow - currentRow) * tileSize;

      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        // Switch to rightmost lane using NORTHEAST sprite for smooth diagonal movement
        setCarDirection("NORTHEAST");
        setCarFrame(0);
        
        const rightLaneX = width * .9 - carWidth / 2;
        
        Animated.parallel([
          Animated.timing(carXAnim, {
            toValue: rightLaneX,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(scrollY, {
            toValue: initialScrollTarget + tileSize * 0.5,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Switch back to NORTH sprite
          setCarDirection("NORTH");
          setCarFrame(0);
          
          // Animate tollgate opening
          setTimeout(() => {
            setTollgate3Open(true);
          }, 300);
          
          // Move forward through tollgate - keeping car in same lane
          setTimeout(() => {
            Animated.timing(scrollY, {
              toValue: initialScrollTarget + tileSize * 3.5,
              duration: 1500,
              useNativeDriver: true,
            }).start(() => {
              setIsCarVisible(false);
              handleFeedback(answer);
            });
          }, 800);
        });
      });
      return;
    } else if (answer === "Turn around and exit the expressway before the toll plaza") {
      // Move to turn position
      const targetRow = 8;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;

      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        // U-turn sequence in one lane using diagonal sprites
        const turnSequence = ["NORTH", "NORTHEAST", "EAST", "SOUTHEAST", "SOUTH"];
        let currentTurnStep = 0;

        const animateUTurn = () => {
          if (currentTurnStep < turnSequence.length) {
            setCarDirection(turnSequence[currentTurnStep]);
            setCarFrame(0);

            let deltaX = 0;

            // Move right during first half of turn
            if (turnSequence[currentTurnStep] === "NORTHEAST") {
              deltaX = tileSize * 0.3;
            } else if (turnSequence[currentTurnStep] === "EAST") {
              deltaX = tileSize * 0.4;
            } else if (turnSequence[currentTurnStep] === "SOUTHEAST") {
              deltaX = tileSize * 0.3;
            }

            const currentCarX = carXAnim._value;

            Animated.timing(carXAnim, {
              toValue: currentCarX + deltaX,
              duration: 400,
              useNativeDriver: false,
            }).start(() => {
              currentTurnStep++;
              animateUTurn();
            });
          } else {
            // Move car backwards (down the screen) after completing U-turn
            Animated.timing(scrollY, {
              toValue: nextTarget - tileSize * 3,
              duration: 2000,
              useNativeDriver: true,
            }).start(() => {
              handleFeedback(answer);
            });
          }
        };
        animateUTurn();
      });
      return;
    } else if (answer === "Follow another vehicle through the toll gate quickly") {
      // Move car forward to tollgate
      const turnStartRow = 8;
      const initialScrollTarget = currentScroll.current + (turnStartRow - currentRow) * tileSize;

      Animated.timing(scrollY, {
        toValue: initialScrollTarget,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        // Animate tollgate 1 (middle) opening
        setTimeout(() => {
          setTollgate1Open(true);
        }, 300);
        
        setTimeout(() => {
          // NPC car moves forward through tollgate first
          Animated.timing(npcCarYAnim, {
            toValue: initialScrollTarget + tileSize * 2,
            duration: 1500,
            useNativeDriver: true,
          }).start(() => {
            setShowNpcCar(false);
          });
          
          // Then player car follows after NPC is through
          setTimeout(() => {
            Animated.timing(scrollY, {
              toValue: initialScrollTarget + tileSize * 2,
              duration: 1500,
              useNativeDriver: true,
            }).start(() => {
              setIsCarVisible(false);
              handleFeedback(answer);
            });
          }, 1000);
        }, 800);
      });
      return;
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setCarFrame(0);
    
    // Reset car position and visibility
    const centerX = width / 2 - carWidth / 2;
    carXAnim.setValue(centerX);
    setCarDirection("NORTH");
    setIsCarVisible(true);
    setCarPaused(false);
    setTollgate1Open(false);
    setTollgate3Open(false);
    
    // Reset NPC car
    setShowNpcCar(true);
    npcCarYAnim.setValue(0);
    
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      router.push('/driver-game/intersections/phase-2/S2P2');
      setQuestionIndex(0);
      setShowQuestion(false);
    }
  };

  // Calculate feedback message
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Toll operators can assist with payment issues and may have procedures for insufficient funds."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  // Ensure car sprite exists for current direction
  const currentCarSprite = carSprites[carDirection] && carSprites[carDirection][carFrame] 
    ? carSprites[carDirection][carFrame] 
    : carSprites["NORTH"][0];

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
        {currentMapLayout.map((row, rowIndex) =>
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
      </Animated.View>

      {/* Car - fixed */}
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

      {/* NPC Car - stationary at row 6, moves forward when activated */}
      {showNpcCar && (
        <Animated.Image
          source={npcCarSprites["NORTH"][npcCarFrame]}
          style={{
            width: carWidth,
            height: carHeight,
            position: "absolute",
            top: 6 * tileSize,
            left: width / 2 - carWidth / 2,
            transform: [
              { translateY: scrollY },
              { translateY: npcCarYAnim }
            ],
            zIndex: 7,
          }}
        />
      )}

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
    fontSize: Math.min(width * 0.045, 24),
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
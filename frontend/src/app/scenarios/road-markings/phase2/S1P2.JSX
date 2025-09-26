import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  Easing,
} from "react-native";
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const playerCarWidth = Math.min(width * 0.25, 280); // Renamed for clarity
const playerCarHeight = playerCarWidth * (350/280);
const jeepWidth = Math.min(width * 0.28, 300); // Slightly wider
const jeepHeight = jeepWidth * (350/280); // Maintain aspect ratio
const npcCarWidth = Math.min(width * 0.24, 260); // NPC car width
const npcCarHeight = npcCarWidth * (350/280); // Maintain aspect ratio
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Road tiles
const roadTiles = {
  road2: require("../../../../assets/road/road2.png"),
  road3: require("../../../../assets/road/road3.png"),
  road5: require("../../../../assets/road/road5.png"),
  road5: require("../../../../assets/road/road5.png"),
};

// Map layout
const mapLayout = [
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
  ["road2", "road5", "road5"],
];

// Separated sprites for clarity and easier management
const playerCarSprites = {
  NORTH: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHWEST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
  WEST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
  ],
  NORTHEAST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
  // Add other directions if needed for specific overtaking maneuvers
};

const jeepneySprites = {
  NORTH: [
    require("../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
};

const npcCarSprites = {
  SOUTH: [
    require("../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/SOUTH/SEPARATED/Black_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/SOUTH/SEPARATED/Black_CIVIC_CLEAN_SOUTH_001.png"),
  ],
};

// Add traffic car sprites
const trafficCarSprites = {
  RED_SEDAN: [
    require("../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_001.png"),
  ],
  TAXI: [
    require("../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_CIVIC_CLEAN_NORTH_001.png"),
  ],
  BLACK_CIVIC: [
    require("../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/NORTH/SEPARATED/Black_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../assets/car/CIVIC TOPDOWN/Black/MOVE/NORTH/SEPARATED/Black_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

const questions = [
  {
    question: "You're driving on NLEX and encounter a single yellow line with broken white line combination. You're on the side with the broken white line and want to overtake a truck blocking your view ahead.",
    options: [" Overtake immediately since you have a broken white line on your side", "Check for oncoming traffic first, then overtake safely when clear", "Don't overtake since there's a yellow line present"],
    correct: "Check for oncoming traffic first, then overtake safely when clear",
    wrongExplanation: {
      " Overtake immediately since you have a broken white line on your side": "Violation! Reckless overtaking without checking for oncoming traffic can result in serious accidents!",
      "Don't overtake since there's a yellow line present": "Road rage prone! In a situation where the area is experiencing traffic, honking a lot can only make other drivers mad and wouldn't make the cars move faster."
    }
  },
  // Add more questions here
];

export default function DrivingGame() {
  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [showIntro, setShowIntro] = useState(true);
  const [isPlayerCarVisible, setIsPlayerCarVisible] = useState(true); // Renamed for clarity
  const [isJeepneyVisible, setIsJeepneyVisible] = useState(true); // State for jeep visibility
  const [isNpcCarVisible, setIsNpcCarVisible] = useState(false); // State for NPC car visibility
  const [showTrafficJam, setShowTrafficJam] = useState(false); // State for traffic jam scenario
  const [showHonking, setShowHonking] = useState(false); // State for honking animation

  const scrollY = useRef(new Animated.Value(0)).current;
  const currentScroll = useRef(0);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null); // New state to track if the answer was correct
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [playerCarDirection, setPlayerCarDirection] = useState("NORTH"); // Renamed for clarity
  const [playerCarFrame, setPlayerCarFrame] = useState(0);
  const [jeepneyFrame, setJeepneyFrame] = useState(0);
  const [npcCarFrame, setNpcCarFrame] = useState(0);
  const [showCollision, setShowCollision] = useState(false);

  const playerCarXAnim = useRef(new Animated.Value(width / 2 - playerCarWidth / 2)).current;

  // Jeepney's X position: Choose your lane (0 = left, 1 = center, 2 = right)
  const jeepneyLane = 1; // Change this number to move the jeep to different lanes
  const jeepneyInitialX = jeepneyLane * tileSize + (tileSize / 2 - jeepWidth / 2);
  // Jeepney's Y position: dynamically set based on scroll and its row
  // Starts off-screen TOP
  const jeepneyYAnim = useRef(new Animated.Value(-jeepHeight)).current;

  // NPC car animations (black car coming from opposite direction)
  const npcCarXAnim = useRef(new Animated.Value(2 * tileSize + (tileSize / 2 - npcCarWidth / 2))).current; // Lane 2 (rightmost)
  const npcCarYAnim = useRef(new Animated.Value(-height)).current; // Starts off-screen top

  // Traffic cars for road rage scenario
  const trafficCars = useRef([
    {
      id: 'traffic1',
      type: 'RED_SEDAN',
      lane: 0,
      yAnim: new Animated.Value(height * 0.3),
      frame: 0,
    },
    {
      id: 'traffic2', 
      type: 'TAXI',
      lane: 1,
      yAnim: new Animated.Value(height * 0.5),
      frame: 0,
    },
    {
      id: 'traffic3',
      type: 'BLACK_CIVIC',
      lane: 2,
      yAnim: new Animated.Value(height * 0.7),
      frame: 0,
    },
    {
      id: 'traffic4',
      type: 'RED_SEDAN',
      lane: 0,
      yAnim: new Animated.Value(height * 0.1),
      frame: 0,
    },
    {
      id: 'traffic5',
      type: 'TAXI',
      lane: 2,
      yAnim: new Animated.Value(height * 0.9),
      frame: 0,
    },
  ]).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Animation for player's car sprite
  useEffect(() => {
    if (!showQuestion && isPlayerCarVisible) {
      const interval = setInterval(() => {
        setPlayerCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isPlayerCarVisible]);

  // Animation for jeepney's sprite
  useEffect(() => {
    if (!showQuestion && isJeepneyVisible) {
      const interval = setInterval(() => {
        setJeepneyFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isJeepneyVisible]);

  // Animation for NPC car's sprite
  useEffect(() => {
    if (!showQuestion && isNpcCarVisible) {
      const interval = setInterval(() => {
        setNpcCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isNpcCarVisible]);

  const scrollAnimationRef = useRef(null);
  const jeepneyAnimationRef = useRef(null); // Ref to hold the jeepney's entry animation

  function startScrollAnimation() {
    scrollY.setValue(0);
    jeepneyYAnim.setValue(-jeepHeight); // Reset jeepney to off-screen top
    npcCarYAnim.setValue(-height); // Reset NPC car to off-screen top
    setIsNpcCarVisible(false); // Hide NPC car initially

    // Continuous looping background scroll - MUCH FASTER
    scrollAnimationRef.current = Animated.loop(
      Animated.timing(scrollY, {
        toValue: -mapHeight,
        duration: mapHeight * 10, // Significantly reduced duration for faster scroll
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    scrollAnimationRef.current.start();

    // Animate jeepney into view from the top
    jeepneyAnimationRef.current = Animated.timing(jeepneyYAnim, {
      toValue: -height * 0.2, // <--- **THIS IS THE KEY CHANGE**
      duration: 3000, // Duration for jeepney to move into position
      easing: Easing.linear,
      useNativeDriver: true,
    });

    jeepneyAnimationRef.current.start(() => {
      // After jeepney is in position, set a timeout to stop scrolling and show question
      setTimeout(() => {
        if (scrollAnimationRef.current) {
          scrollAnimationRef.current.stop(); // Stop the continuous scroll
        }

        // Freeze car and jeepney sprite animations
        setIsPlayerCarVisible(true);
        setIsJeepneyVisible(true);
        setPlayerCarFrame(0);
        setJeepneyFrame(0);

        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 2000); // Time to drive before the question appears after jeepney is in view
    });
  }

  useEffect(() => {
    if (!showIntro) {
      startScrollAnimation();
    }
    return () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
          jeepneyAnimationRef.current.stop();
      }
    };
  }, [showIntro]);

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

const animateOvertake = async (targetX) => {
    // Stop continuous scroll and sprite animations for a moment
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    // 1. Car faces Northwest and moves slightly to the left (initial lane change)
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetX, // Move left towards the target lane
                duration: 300,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 0.5), // Move forward slightly
                duration: 300,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 2. Car faces North and moves further forward (main overtaking acceleration)
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH"); // Face North
        Animated.parallel([
            Animated.timing(jeepneyYAnim, { // <--- ADD THIS ANIMATION FOR JEEPNEY
                toValue: height + jeepHeight, // Move the jeepney off-screen bottom
                duration: 1000, // Duration for jeepney to disappear
                easing: Easing.linear,
                useNativeDriver: true,
            }),
            Animated.timing(scrollY, { // Player car continues to move significantly forward
                toValue: scrollY._value - (tileSize * 3), // More forward movement
                duration: 1000,
                easing: Easing.easeOut,
                useNativeDriver: true,
            }),
        ]).start(resolve);
    });
    setIsJeepneyVisible(false); // Hide jeepney after it's out of view

    // 3. Car faces Northeast and moves back towards the right (returning to lane)
    await new Promise(resolve => {
        setPlayerCarDirection("NORTHEAST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: width / 2 - playerCarWidth / 2, // Move back to center X
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, { // Still moving forward slightly during lane change
                toValue: scrollY._value - (tileSize * 0.5),
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 4. Car faces North again
    setPlayerCarDirection("NORTH");

    // Restart continuous scroll and sprite animations
    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(false); // Reset for next scenario, if needed
  };

  // NEW: Collision animation for immediate overtaking
  const animateCollision = async () => {
    // Stop continuous scroll
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

    // Show NPC car coming from opposite direction in lane 2
    setIsNpcCarVisible(true);
    npcCarYAnim.setValue(-height * 0.3); // Start NPC car closer to view

    // Start NPC car moving down towards collision point
    const npcMovement = Animated.timing(npcCarYAnim, {
      toValue: height * 0.6, // Move NPC car down to collision area
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    npcMovement.start();

    // 1. Player car immediately moves to lane 2 (reckless overtaking)
    await new Promise(resolve => {
        setPlayerCarDirection("EAST"); // Face East for aggressive lane change
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: 2 * tileSize + (tileSize / 2 - playerCarWidth / 2), // Move to lane 2
                duration: 800,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 1), // Move forward
                duration: 800,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 2. COLLISION! Both cars shake/vibrate
    setShowCollision(true);
    setPlayerCarDirection("NORTH"); // Face forward during collision
    
    // Create collision shake effect
    const shakePlayer = Animated.sequence([
      Animated.timing(playerCarXAnim, { toValue: playerCarXAnim._value + 20, duration: 50, useNativeDriver: false }),
      Animated.timing(playerCarXAnim, { toValue: playerCarXAnim._value - 40, duration: 50, useNativeDriver: false }),
      Animated.timing(playerCarXAnim, { toValue: playerCarXAnim._value + 40, duration: 50, useNativeDriver: false }),
      Animated.timing(playerCarXAnim, { toValue: playerCarXAnim._value - 20, duration: 50, useNativeDriver: false }),
    ]);

    const shakeNpc = Animated.sequence([
      Animated.timing(npcCarXAnim, { toValue: npcCarXAnim._value - 20, duration: 50, useNativeDriver: false }),
      Animated.timing(npcCarXAnim, { toValue: npcCarXAnim._value + 40, duration: 50, useNativeDriver: false }),
      Animated.timing(npcCarXAnim, { toValue: npcCarXAnim._value - 40, duration: 50, useNativeDriver: false }),
      Animated.timing(npcCarXAnim, { toValue: npcCarXAnim._value + 20, duration: 50, useNativeDriver: false }),
    ]);

    // Stop NPC movement and shake both cars
    npcMovement.stop();
    await Promise.all([
      new Promise(resolve => shakePlayer.start(resolve)),
      new Promise(resolve => shakeNpc.start(resolve))
    ]);

    // 3. Stop all movement (crash scene)
    await new Promise(resolve => setTimeout(resolve, 1000));

    setShowCollision(false);
    setIsNpcCarVisible(false);
    
    // Reset positions for next scenario
    const centerX = width / 2 - playerCarWidth / 2;
    playerCarXAnim.setValue(centerX);
    npcCarXAnim.setValue(2 * tileSize + (tileSize / 2 - npcCarWidth / 2));
  };

  // NEW: Safe overtake animation (same as collision but without the NPC car/crash)
  const animateSafeOvertake = async () => {
    // Stop continuous scroll
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

    // 1. Player car pauses first (checking for traffic)
    setPlayerCarDirection("NORTH"); // Face forward while checking
    await new Promise(resolve => setTimeout(resolve, 1500)); // Pause to "check"

    // 2. Player car moves to lane 2 (right lane for overtaking)
    await new Promise(resolve => {
        setPlayerCarDirection("EAST"); // Face East for lane change
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: 2 * tileSize + (tileSize / 2 - playerCarWidth / 2), // Move to lane 2
                duration: 1200, // Smooth lane change
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 1), // Move forward
                duration: 1200,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 3. Continue moving forward to complete the overtake
    await new Promise(resolve => {
        setPlayerCarDirection("NORTH"); // Face North while overtaking
        Animated.parallel([
            Animated.timing(jeepneyYAnim, {
                toValue: height + jeepHeight, // Move the jeepney off-screen bottom
                duration: 1500, // Duration for jeepney to disappear
                easing: Easing.linear,
                useNativeDriver: true,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 2), // Move forward more
                duration: 1500,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    setIsJeepneyVisible(false); // Hide jeepney after it's out of view

    // 4. Move back to center lane (completing the overtake)
    await new Promise(resolve => {
        setPlayerCarDirection("WEST"); // Face West to return to lane
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: width / 2 - playerCarWidth / 2, // Move back to center
                duration: 1000,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 0.5), // Continue forward slightly
                duration: 1000,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    // 5. Face North again and continue
    setPlayerCarDirection("NORTH");

    // Restart continuous scroll and sprite animations
    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    setIsPlayerCarVisible(true);
  };

  // NEW: Traffic jam animation for road rage scenario  
  const animateTrafficJam = async () => {
    try {
      // Stop continuous scroll
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

      // Show traffic jam
      setShowTrafficJam(true);

      // Position traffic cars in a realistic traffic jam formation
      trafficCars.forEach((car, index) => {
        const xPos = car.lane * tileSize + (tileSize / 2 - npcCarWidth / 2);
        car.yAnim.setValue(height * (0.1 + index * 0.15)); // Stagger cars vertically
      });

      // 1. Show all cars stopped in traffic (very slow movement to simulate crawling traffic)
      const crawlAnimations = trafficCars.map(car => 
        Animated.timing(car.yAnim, {
          toValue: car.yAnim._value + 50, // Move very slightly forward
          duration: 5000, // Very slow movement
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      // Start crawling traffic
      crawlAnimations.forEach(anim => anim.start());

      // 2. Wait a bit, then start honking sequence
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowHonking(true);

      // 3. Create honking effect with car shaking (road rage)
      const honkingSequence = async () => {
        for (let i = 0; i < 5; i++) { // 5 rounds of honking
          // Player car honks first (shake effect)
          const playerShake = Animated.sequence([
            Animated.timing(playerCarXAnim, { toValue: playerCarXAnim._value + 10, duration: 100, useNativeDriver: false }),
            Animated.timing(playerCarXAnim, { toValue: playerCarXAnim._value - 10, duration: 100, useNativeDriver: false }),
          ]);
          
          await new Promise(resolve => playerShake.start(resolve));
          
          // Other cars respond with angry honking (shake effects)
          const trafficShakes = trafficCars.slice(0, 3).map(car => 
            Animated.sequence([
              Animated.timing(car.yAnim, { toValue: car.yAnim._value + 15, duration: 120, useNativeDriver: true }),
              Animated.timing(car.yAnim, { toValue: car.yAnim._value - 15, duration: 120, useNativeDriver: true }),
            ])
          );

          await Promise.all(trafficShakes.map(shake => new Promise(resolve => shake.start(resolve))));
          
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      };

      await honkingSequence();

      // 4. Show that traffic didn't improve - cars still barely moving
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stop all animations
      crawlAnimations.forEach(anim => anim.stop());
      
      setShowHonking(false);
      setShowTrafficJam(false);
      
      // Reset positions
      const centerX = width / 2 - playerCarWidth / 2;
      playerCarXAnim.setValue(centerX);
    } catch (error) {
      console.error('Error in animateTrafficJam:', error);
      // Cleanup in case of error
      setShowHonking(false);
      setShowTrafficJam(false);
    }
  };

  // Adjust handleAnswer to call appropriate animations
  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    // If scrollAnimationRef.current exists, restart it for continuous movement after answering
    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.start();
    }

    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    if (answer === questions[questionIndex].correct) {
      // Correct answer - safe overtake animation
      animateSafeOvertake();
      handleFeedback(answer); // Provide feedback
    } else if (answer === " Overtake immediately since you have a broken white line on your side") {
      // COLLISION ANIMATION for reckless immediate overtaking
      animateCollision();
      handleFeedback(answer); // Call feedback after collision
    } else if (answer === "Don't overtake since there's a yellow line present") {
        // TRAFFIC JAM ANIMATION for road rage scenario
        animateTrafficJam();
        handleFeedback(answer); // Call feedback after traffic jam
      }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null); // Reset feedback state
    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    const centerX = width / 2 - playerCarWidth / 2;
    playerCarXAnim.setValue(centerX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
      // Navigate to s1p2 using Expo Router
      router.push('/driver-game/road-markings/phase2/s2p2');
      setShowQuestion(false);
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
          jeepneyAnimationRef.current.stop();
      }
    }
  };

  const handleStartGame = () => {
    setShowIntro(false);
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! When you're on the side with the broken white line, you CAN overtake after checking for oncoming traffic and ensuring it's safe to do so."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";

  if (showIntro) {
    return (
      <View style={styles.introContainer}>
        <Image
          source={require("../../../../assets/dialog/Dialog.png")}
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
    <View style={{ flex: 1, backgroundColor: "black", overflow: 'hidden' }}>
      {/* Map - Looping background */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: mapHeight * 2,
          left: 0,
          transform: [{
            translateY: scrollY.interpolate({
              inputRange: [-mapHeight, 0],
              outputRange: [0, -mapHeight],
              extrapolate: 'clamp',
            })
          }],
          zIndex: 1,
        }}
      >
        {[0, 1].map((multiplier) => (
          mapLayout.map((row, rowIndex) => (
            <React.Fragment key={`${rowIndex}-${multiplier}`}>
              {row.map((tile, colIndex) => (
                <Image
                  key={`${rowIndex}-${colIndex}-${multiplier}`}
                  source={roadTiles[tile]}
                  style={{
                    position: "absolute",
                    width: tileSize,
                    height: tileSize,
                    left: colIndex * tileSize,
                    top: rowIndex * tileSize + (multiplier * mapHeight),
                  }}
                  resizeMode="stretch"
                />
              ))}
            </React.Fragment>
          ))
        ))}
      </Animated.View>

      {/* Responsive Jeepney */}
      {isJeepneyVisible && (
        <Animated.Image
          source={jeepneySprites.NORTH[jeepneyFrame]}
          style={{
            width: jeepWidth,
            height: jeepHeight,
            position: "absolute",
            left: jeepneyInitialX,
            transform: [{ translateY: jeepneyYAnim }],
            zIndex: 4,
          }}
        />
      )}

      {/* NPC Car (Black car for collision) */}
      {isNpcCarVisible && (
        <Animated.Image
          source={npcCarSprites.SOUTH[npcCarFrame]}
          style={{
            width: npcCarWidth,
            height: npcCarHeight,
            position: "absolute",
            transform: [
              { translateX: npcCarXAnim },
              { translateY: npcCarYAnim }
            ],
            zIndex: 3,
          }}
        />
      )}

      {/* Traffic Cars (for road rage scenario) */}
      {showTrafficJam && trafficCars.map(car => {
        const xPos = car.lane * tileSize + (tileSize / 2 - npcCarWidth / 2);
        const spriteSource = trafficCarSprites[car.type][car.frame];

        return (
          <Animated.Image
            key={car.id}
            source={spriteSource}
            style={{
              width: npcCarWidth,
              height: npcCarHeight,
              position: "absolute",
              left: xPos,
              transform: [{ translateY: car.yAnim }],
              zIndex: 3,
            }}
          />
        );
      })}

      {/* Honking Effect */}
      {showHonking && (
        <View style={{
          position: "absolute",
          width: width,
          height: height,
          zIndex: 9,
          pointerEvents: "none",
        }}>
          {/* Honking indicators around cars */}
          <View style={{
            position: "absolute",
            left: playerCarXAnim._value - 30,
            bottom: height * 0.05,
            width: 60,
            height: 30,
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Text style={{
              color: "yellow",
              fontSize: 20,
              fontWeight: "bold",
              textShadowColor: "black",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 3,
            }}>
              HONK!
            </Text>
          </View>

          {/* Multiple honking sounds from other cars */}
          <View style={{
            position: "absolute",
            left: width * 0.1,
            top: height * 0.3,
            width: 60,
            height: 30,
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Text style={{
              color: "orange",
              fontSize: 16,
              fontWeight: "bold",
              textShadowColor: "black",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 3,
            }}>
              BEEP!
            </Text>
          </View>

          <View style={{
            position: "absolute",
            right: width * 0.1,
            top: height * 0.5,
            width: 60,
            height: 30,
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Text style={{
              color: "red",
              fontSize: 18,
              fontWeight: "bold",
              textShadowColor: "black",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 3,
            }}>
              HONK!
            </Text>
          </View>

          {/* Central message about road rage */}
          <View style={{
            position: "absolute",
            top: height * 0.15,
            left: width * 0.1,
            right: width * 0.1,
            backgroundColor: "rgba(255, 100, 100, 0.8)",
            padding: 15,
            borderRadius: 10,
            alignItems: "center",
          }}>
            <Text style={{
              color: "white",
              fontSize: 16,
              fontWeight: "bold",
              textAlign: "center",
            }}>
              Traffic is NOT moving faster!
            </Text>
            <Text style={{
              color: "white",
              fontSize: 14,
              textAlign: "center",
              marginTop: 5,
            }}>
              Honking causes road rage!
            </Text>
          </View>
        </View>
      )}

      {/* Collision Effect */}
      {showCollision && (
        <View style={{
          position: "absolute",
          width: width,
          height: height,
          backgroundColor: "rgba(255, 0, 0, 0.3)", // Red flash for collision
          zIndex: 10,
          justifyContent: "center",
          alignItems: "center",
        }}>
          <Text style={{
            color: "white",
            fontSize: 40,
            fontWeight: "bold",
            textShadowColor: "black",
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 5,
          }}>
            CRASH!
          </Text>
        </View>
      )}

      {/* Responsive Player Car */}
      {isPlayerCarVisible && (
        <Animated.Image
          source={playerCarSprites[playerCarDirection][playerCarFrame]}
          style={{
            width: playerCarWidth,
            height: playerCarHeight,
            position: "absolute",
            bottom: height * 0.1,
            left: playerCarXAnim,
            zIndex: 5,
          }}
        />
      )}

      {/* Responsive Question Overlay */}
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

      {/* Responsive Answers */}
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

      {/* Responsive Feedback - Correct/Wrong */}
      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../../../../assets/dialog/Dialog w answer.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Responsive Next Button */}
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
  // Intro styles (responsive)
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

  // In-game responsive styles
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
  },
  questionTextContainer: {
    padding: -height * 0.04,
    maxWidth: width * 0.6,
  },
  questionText: {
    color: "white",
    fontSize: Math.min(width * 0.018, 18),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.1,
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
    fontSize: Math.min(width * 0.04, 11),
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
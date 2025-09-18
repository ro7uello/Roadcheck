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
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");

// Responsive calculations (keep these as they are)
const playerCarWidth = Math.min(width * 0.25, 280);
const playerCarHeight = playerCarWidth * (350/280);
const jeepWidth = Math.min(width * 0.28, 300);
const jeepHeight = jeepWidth * (350/280);
const npcCarWidth = Math.min(width * 0.25, 280); // Assuming similar size to player car
const npcCarHeight = npcCarWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Road tiles and map layout (keep these as they are)
const roadTiles = {
    road2: require("../assets/road/road2.png"),
    road5: require("../assets/road/road5.png"),
    road7: require("../assets/road/road7.png"),
};

const mapLayout = [
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
  ["road2", "road7", "road5", "road2", "road2"],
];

// Separated sprites (keep these as they are, but note the NPC car additions)
const playerCarSprites = {
  NORTH: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHWEST: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
  WEST: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
  ],
  NORTHEAST: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
};

const jeepneySprites = {
  NORTH: [
    require("../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../assets/car/JEEP TOP DOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
};

const npcCar1 = { // Brown Sport Car (Northbound, Leftmost Lane)
    NORTH: [
        require("../assets/car/SPORT TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_SPORT_CLEAN_NORTH_000.png"),
        require("../assets/car/SPORT TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_SPORT_CLEAN_NORTH_001.png"),
    ],
};
const npcCar2 = { // Red SUV (Northbound, Lane 3)
    NORTH: [
        require("../assets/car/SUV TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SUV_CLEAN_NORTH_000.png"),
        require("../assets/car/SUV TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_SUV_CLEAN_NORTH_001.png"),
    ],
};
const npcCar3 = { // Green Sport Car (Southbound, Rightmost Lane)
    SOUTH: [
        require("../assets/car/SPORT TOPDOWN/Green/MOVE/SOUTH/SEPARATED/Green_SPORT_CLEAN_SOUTH_000.png"),
        require("../assets/car/SPORT TOPDOWN/Green/MOVE/SOUTH/SEPARATED/Green_SPORT_CLEAN_SOUTH_001.png"),
    ],
};
const npcCar4 = { // Magenta SUV (Southbound, Lane 4)
    SOUTH: [
        require("../assets/car/SUV TOPDOWN/Magenta/MOVE/SOUTH/SEPARATED/Magenta_SUV_CLEAN_SOUTH_000.png"),
        require("../assets/car/SUV TOPDOWN/Magenta/MOVE/SOUTH/SEPARATED/Magenta_SUV_CLEAN_SOUTH_001.png"),
    ],
};

const questions = [
  {
    question: "You see double solid yellow lines but notice other drivers frequently crossing them. You're running late for an important meeting.",
    options: ["Follow other drivers and cross the lines since everyone is doing it", "Cross only if no traffic enforcers are visible", "Respect the double solid yellow lines regardless of others' behavior"],
    correct: "Respect the double solid yellow lines regardless of others' behavior",
    wrongExplanation: {
      "Follow other drivers and cross the lines since everyone is doing it": "Accident prone! Always follow the road markings to avoid violations and accidents. Following others' bad habits is dangerous.",
      "Cross only if no traffic enforcers are visible": "Accident prone! Even if there are no traffic enforcers, road markings are there to guide other motorists as well. Following them will help avoid violations and accidents."
    }
  },
];

export default function DrivingGame() {
  const navigation = useNavigation();

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isPlayerCarVisible, setIsPlayerCarVisible] = useState(true);
  const [isJeepneyVisible, setIsJeepneyVisible] = useState(true);
  // NEW: State for NPC cars visibility
  const [isNpcCar1Visible, setIsNpcCar1Visible] = useState(true);
  const [isNpcCar2Visible, setIsNpcCar2Visible] = useState(true);
  const [isNpcCar3Visible, setIsNpcCar3Visible] = useState(true);
  const [isNpcCar4Visible, setIsNpcCar4Visible] = useState(true);

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
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [playerCarDirection, setPlayerCarDirection] = useState("NORTH");
  const [playerCarFrame, setPlayerCarFrame] = useState(0);
  const [jeepneyFrame, setJeepneyFrame] = useState(0);
  // NEW: State for NPC car frames
  const [npcCar1Frame, setNpcCar1Frame] = useState(0);
  const [npcCar2Frame, setNpcCar2Frame] = useState(0);
  const [npcCar3Frame, setNpcCar3Frame] = useState(0);
  const [npcCar4Frame, setNpcCar4Frame] = useState(0);


  const playerCarXAnim = useRef(new Animated.Value(width / 2 - playerCarWidth / 2)).current;

  const jeepneyInitialX = 2 * tileSize + (tileSize / 2 - jeepWidth / 2);
  const jeepneyYAnim = useRef(new Animated.Value(-jeepHeight)).current;

  // NEW: NPC Car initial X positions (center of their respective lanes)
  const npcCar1InitialX = 0 * tileSize + (tileSize / 2 - npcCarWidth / 2); // Lane 0
  const npcCar2InitialX = 3 * tileSize + (tileSize / 2 - npcCarWidth / 2); // Lane 3
  const npcCar3InitialX = 4 * tileSize + (tileSize / 2 - npcCarWidth / 2); // Lane 4
  const npcCar4InitialX = 1 * tileSize + (tileSize / 2 - npcCarWidth / 2); // Lane 1

  // NEW: NPC Car Y position animations (relative to scrollY)
  // They should also scroll with the background, but might have different offsets or speeds
  const npcCar1YAnim = useRef(new Animated.Value(-npcCarHeight * 2)).current; // Start further off-screen
  const npcCar2YAnim = useRef(new Animated.Value(-npcCarHeight * 4)).current; // Start even further off-screen
  const npcCar3YAnim = useRef(new Animated.Value(mapHeight + npcCarHeight)).current; // Start off-screen bottom for southbound
  const npcCar4YAnim = useRef(new Animated.Value(mapHeight + npcCarHeight * 3)).current; // Start even further off-screen bottom for southbound


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

  // NEW: Animation for NPC car sprites
  useEffect(() => {
    const npc1Interval = setInterval(() => {
      if (!showQuestion && isNpcCar1Visible) setNpcCar1Frame((prevFrame) => (prevFrame === 0 ? 1 : 0));
    }, 280); // Slightly different speed
    const npc2Interval = setInterval(() => {
        if (!showQuestion && isNpcCar2Visible) setNpcCar2Frame((prevFrame) => (prevFrame === 0 ? 1 : 0));
    }, 220);
    const npc3Interval = setInterval(() => {
        if (!showQuestion && isNpcCar3Visible) setNpcCar3Frame((prevFrame) => (prevFrame === 0 ? 1 : 0));
    }, 270);
    const npc4Interval = setInterval(() => {
        if (!showQuestion && isNpcCar4Visible) setNpcCar4Frame((prevFrame) => (prevFrame === 0 ? 1 : 0));
    }, 230);

    return () => {
      clearInterval(npc1Interval);
      clearInterval(npc2Interval);
      clearInterval(npc3Interval);
      clearInterval(npc4Interval);
    };
  }, [showQuestion, isNpcCar1Visible, isNpcCar2Visible, isNpcCar3Visible, isNpcCar4Visible]);


  const scrollAnimationRef = useRef(null);
  const jeepneyAnimationRef = useRef(null);
  // NEW: Refs for NPC car animations
  const npcCar1AnimationRef = useRef(null);
  const npcCar2AnimationRef = useRef(null);
  const npcCar3AnimationRef = useRef(null);
  const npcCar4AnimationRef = useRef(null);


  function startScrollAnimation() {
    scrollY.setValue(0);
    jeepneyYAnim.setValue(-jeepHeight);
    // NEW: Reset NPC car positions
    npcCar1YAnim.setValue(-npcCarHeight * 2);
    npcCar2YAnim.setValue(-npcCarHeight * 4);
    npcCar3YAnim.setValue(mapHeight + npcCarHeight);
    npcCar4YAnim.setValue(mapHeight + npcCarHeight * 3);


    playerCarXAnim.setValue(width / 2 - playerCarWidth / 2);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    // NEW: Set NPC cars visible
    setIsNpcCar1Visible(true);
    setIsNpcCar2Visible(true);
    setIsNpcCar3Visible(true);
    setIsNpcCar4Visible(true);


    scrollAnimationRef.current = Animated.loop(
      Animated.timing(scrollY, {
        toValue: -mapHeight,
        duration: mapHeight * 10,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    scrollAnimationRef.current.start();

    jeepneyAnimationRef.current = Animated.timing(jeepneyYAnim, {
      toValue: -height * 0.2,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    jeepneyAnimationRef.current.start(() => {
      setTimeout(() => {
        if (scrollAnimationRef.current) {
          scrollAnimationRef.current.stop();
        }
        setIsPlayerCarVisible(true);
        setIsJeepneyVisible(true);
        // NEW: Stop NPC cars sprite animations and set frame
        setIsNpcCar1Visible(true); setNpcCar1Frame(0);
        setIsNpcCar2Visible(true); setNpcCar2Frame(0);
        setIsNpcCar3Visible(true); setNpcCar3Frame(0);
        setIsNpcCar4Visible(true); setNpcCar4Frame(0);

        setPlayerCarFrame(0);
        setJeepneyFrame(0);

        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 2000);
    });

    // NEW: NPC Car 1 animation (northbound, moves with scroll)
    npcCar1AnimationRef.current = Animated.loop(
        Animated.timing(npcCar1YAnim, {
            toValue: mapHeight + npcCarHeight, // Move off-screen bottom
            duration: mapHeight * 15, // Slower than main scroll, so it appears to be moving against it
            easing: Easing.linear,
            useNativeDriver: true,
        })
    );
    npcCar1AnimationRef.current.start();

    // NEW: NPC Car 2 animation (northbound, moves with scroll)
    npcCar2AnimationRef.current = Animated.loop(
        Animated.timing(npcCar2YAnim, {
            toValue: mapHeight + npcCarHeight,
            duration: mapHeight * 12, // Faster than npcCar1
            easing: Easing.linear,
            useNativeDriver: true,
        })
    );
    npcCar2AnimationRef.current.start();

    // NEW: NPC Car 3 animation (southbound, moves against scroll)
    npcCar3AnimationRef.current = Animated.loop(
        Animated.timing(npcCar3YAnim, {
            toValue: -npcCarHeight, // Move off-screen top
            duration: mapHeight * 15,
            easing: Easing.linear,
            useNativeDriver: true,
        })
    );
    npcCar3AnimationRef.current.start();

    // NEW: NPC Car 4 animation (southbound, moves against scroll)
    npcCar4AnimationRef.current = Animated.loop(
        Animated.timing(npcCar4YAnim, {
            toValue: -npcCarHeight,
            duration: mapHeight * 12,
            easing: Easing.linear,
            useNativeDriver: true,
        })
    );
    npcCar4AnimationRef.current.start();

  }

  useEffect(() => {
    startScrollAnimation();
    return () => {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
      if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();
      // NEW: Stop NPC car animations on unmount
      if (npcCar1AnimationRef.current) npcCar1AnimationRef.current.stop();
      if (npcCar2AnimationRef.current) npcCar2AnimationRef.current.stop();
      if (npcCar3AnimationRef.current) npcCar3AnimationRef.current.stop();
      if (npcCar4AnimationRef.current) npcCar4AnimationRef.current.stop();
    };
  }, []);

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

  const animateStayInLane = async () => {
    // Keep scroll animation running
    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop(); // Jeepney stays put for feedback
    // NEW: Keep NPC car animations running
    if (npcCar1AnimationRef.current) npcCar1AnimationRef.current.start();
    if (npcCar2AnimationRef.current) npcCar2AnimationRef.current.start();
    if (npcCar3AnimationRef.current) npcCar3AnimationRef.current.start();
    if (npcCar4AnimationRef.current) npcCar4AnimationRef.current.start();

    setPlayerCarDirection("NORTH");
    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    // NEW: Ensure NPC cars are visible and their frames are reset
    setIsNpcCar1Visible(true); setNpcCar1Frame(0);
    setIsNpcCar2Visible(true); setNpcCar2Frame(0);
    setIsNpcCar3Visible(true); setNpcCar3Frame(0);
    setIsNpcCar4Visible(true); setNpcCar4Frame(0);


    // No specific player car movement for "stay in lane", just continue scrolling
    await new Promise(resolve => setTimeout(resolve, 500)); // Small pause before feedback
    handleFeedback(selectedAnswer);
  };

  const animateSuddenOvertake = async () => {
    // Keep scroll animation running
    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop(); // Jeepney stays put
    // NEW: Keep NPC car animations running
    if (npcCar1AnimationRef.current) npcCar1AnimationRef.current.start();
    if (npcCar2AnimationRef.current) npcCar2AnimationRef.current.start();
    if (npcCar3AnimationRef.current) npcCar3AnimationRef.current.start();
    if (npcCar4AnimationRef.current) npcCar4AnimationRef.current.start();

    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    // NEW: Ensure NPC cars are visible and their frames are reset
    setIsNpcCar1Visible(true); setNpcCar1Frame(0);
    setIsNpcCar2Visible(true); setNpcCar2Frame(0);
    setIsNpcCar3Visible(true); setNpcCar3Frame(0);
    setIsNpcCar4Visible(true); setNpcCar4Frame(0);


    const targetXLeftLane = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);

    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetXLeftLane,
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            // Only scrollY is handled by the loop, no additional scroll here
        ]).start(resolve);
    });

    await new Promise(resolve => {
        setPlayerCarDirection("NORTH");
        Animated.parallel([
            Animated.timing(jeepneyYAnim, {
                toValue: jeepneyYAnim._value + height + jeepHeight, // Move jeepney far down relative to its current pos
                duration: 800,
                easing: Easing.easeIn,
                useNativeDriver: true,
            }),
            // Only scrollY is handled by the loop, no additional scroll here
        ]).start(resolve);
    });
    setIsJeepneyVisible(false);

    setPlayerCarDirection("NORTH");

    await new Promise(resolve => setTimeout(resolve, 1000));
    handleFeedback(selectedAnswer);
  };

  const animateCarefulOvertake = async () => {
    // Keep scroll animation running
    if (scrollAnimationRef.current) scrollAnimationRef.current.start();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop(); // Jeepney stays put
    // NEW: Keep NPC car animations running
    if (npcCar1AnimationRef.current) npcCar1AnimationRef.current.start();
    if (npcCar2AnimationRef.current) npcCar2AnimationRef.current.start();
    if (npcCar3AnimationRef.current) npcCar3AnimationRef.current.start();
    if (npcCar4AnimationRef.current) npcCar4AnimationRef.current.start();

    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    // NEW: Ensure NPC cars are visible and their frames are reset
    setIsNpcCar1Visible(true); setNpcCar1Frame(0);
    setIsNpcCar2Visible(true); setNpcCar2Frame(0);
    setIsNpcCar3Visible(true); setNpcCar3Frame(0);
    setIsNpcCar4Visible(true); setNpcCar4Frame(0);


    const targetXLeftLane = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);

    // No scroll animation here as it's handled by the loop

    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetXLeftLane,
                duration: 800,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            // Only scrollY is handled by the loop, no additional scroll here
        ]).start(resolve);
    });

    await new Promise(resolve => {
        setPlayerCarDirection("NORTH");
        Animated.parallel([
            Animated.timing(jeepneyYAnim, {
                toValue: jeepneyYAnim._value + height + jeepHeight, // Move jeepney far down relative to its current pos
                duration: 1200,
                easing: Easing.easeIn,
                useNativeDriver: true,
            }),
            // Only scrollY is handled by the loop, no additional scroll here
        ]).start(resolve);
    });
    setIsJeepneyVisible(false);

    setPlayerCarDirection("NORTH");

    await new Promise(resolve => setTimeout(resolve, 1000));
    handleFeedback(selectedAnswer);
  };


  const handleAnswer = async (option) => {
    setSelectedAnswer(option);
    setShowQuestion(false);
    setShowAnswers(false);

    // Importantly, DO NOT STOP scrollAnimationRef.current here.
    // It should continue running during the answer animation.
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();
    // NEW: Stop NPC car animations immediately (if they need to pause for the interaction)
    // Or keep them running if they should continue in the background
    if (npcCar1AnimationRef.current) npcCar1AnimationRef.current.stop();
    if (npcCar2AnimationRef.current) npcCar2AnimationRef.current.stop();
    if (npcCar3AnimationRef.current) npcCar3AnimationRef.current.stop();
    if (npcCar4AnimationRef.current) npcCar4AnimationRef.current.stop();


    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    // NEW: Ensure NPC cars are visible before animating
    setIsNpcCar1Visible(true);
    setIsNpcCar2Visible(true);
    setIsNpcCar3Visible(true);
    setIsNpcCar4Visible(true);

    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    // NEW: Reset NPC car frames
    setNpcCar1Frame(0);
    setNpcCar2Frame(0);
    setNpcCar3Frame(0);
    setNpcCar4Frame(0);

    const actualCorrectAnswer = questions[questionIndex].correct;

    if (option === actualCorrectAnswer) {
      await animateStayInLane();
      handleFeedback(option)
    } else if (option === "Follow other drivers and cross the lines since everyone is doing it") {
      await animateSuddenOvertake();
      handleFeedback(option)
    } else if (option === "Cross only if no traffic enforcers are visible") { // Assuming this also triggers an overtake
        await animateCarefulOvertake();
    } else {
        // Fallback for any other wrong answer if not handled by specific animations
        await new Promise(resolve => setTimeout(resolve, 1000));
        handleFeedback(option);
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    // NEW: Reset NPC car frames
    setNpcCar1Frame(0);
    setNpcCar2Frame(0);
    setNpcCar3Frame(0);
    setNpcCar4Frame(0);


    const centerX = width / 2 - playerCarWidth / 2;
    playerCarXAnim.setValue(centerX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    // NEW: Set NPC cars visible
    setIsNpcCar1Visible(true);
    setIsNpcCar2Visible(true);
    setIsNpcCar3Visible(true);
    setIsNpcCar4Visible(true);


    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation(); // Restart full animation cycle for next question
    } else {
      navigation.navigate('S9P1');
      setShowQuestion(false);
      // Ensure all animations are stopped when navigating away
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
      if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();
      if (npcCar1AnimationRef.current) npcCar1AnimationRef.current.stop();
      if (npcCar2AnimationRef.current) npcCar2AnimationRef.current.stop();
      if (npcCar3AnimationRef.current) npcCar3AnimationRef.current.stop();
      if (npcCar4AnimationRef.current) npcCar4AnimationRef.current.stop();
    }
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You must follow traffic rules regardless of others' behavior or your personal circumstances."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";


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
          mapLayout.map((row, rowIndex) =>
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
          )
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
            left: jeepneyInitialX, // Keep it in its lane
            transform: [{ translateY: jeepneyYAnim }],
            zIndex: 4,
          }}
                  />
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

      {/* NEW: Responsive NPC Car 1 */}
      {isNpcCar1Visible && (
        <Animated.Image
          source={npcCar1.NORTH[npcCar1Frame]}
          style={{
            width: npcCarWidth,
            height: npcCarHeight,
            position: "absolute",
            left: npcCar1InitialX,
            // NPC cars need to scroll with the background but also move independently
            // This setup makes them appear to move "up" relative to the screen
            transform: [{
                translateY:npcCar1YAnim
            }],
            zIndex: 3, // Behind player and jeepney
          }}
        />
      )}

      {/* NEW: Responsive NPC Car 2 */}
      {isNpcCar2Visible && (
        <Animated.Image
          source={npcCar2.NORTH[npcCar2Frame]}
          style={{
            width: npcCarWidth,
            height: npcCarHeight,
            position: "absolute",
            left: npcCar2InitialX,
            transform: [{
                translateY:npcCar2YAnim
            }],
            zIndex: 3,
          }}
        />
      )}

      {/* NEW: Responsive NPC Car 3 */}
      {isNpcCar3Visible && (
        <Animated.Image
          source={npcCar3.SOUTH[npcCar3Frame]} // Note: SOUTH sprite
          style={{
            width: npcCarWidth,
            height: npcCarHeight,
            position: "absolute",
            left: npcCar3InitialX,
            // Southbound cars move "down" relative to the screen, against the scrollY
            transform: [{
                translateY:npcCar3YAnim
            }],
            zIndex: 5,
          }}
        />
      )}

      {/* NEW: Responsive NPC Car 4 */}
      {isNpcCar4Visible && (
        <Animated.Image
          source={npcCar4.SOUTH[npcCar4Frame]} // Note: SOUTH sprite
          style={{
            width: npcCarWidth,
            height: npcCarHeight,
            position: "absolute",
            left: npcCar4InitialX,
            transform: [{
                translateY: npcCar4YAnim
            }],
            zIndex: 3,
          }}
        />
      )}

      {/* Responsive Question Overlay */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image
            source={require("../assets/dialog/LTO.png")}
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

      {/* Responsive Feedback - Updated to use S2P1 format */}
      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../assets/dialog/LTO.png")} style={styles.ltoImage} />
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
  // No intro styles (responsive)
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
    fontSize: Math.min(width * 0.045, 28),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.4,
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
import { shuffle } from "@/lib/utils";
import type { Question } from "@/lib/types";

export const ROUND_DURATION_MS = 25000;
export const QUESTION_COUNT = 20;

type RawQuestion = {
  sentenceStart: string;
  correctAnswer: string;
  decoyAnswers: string[];
};

const QUESTION_BANK: RawQuestion[] = [
  {
    sentenceStart: "why is the moon",
    correctAnswer: "following me when I drive",
    decoyAnswers: [
      "turning red tonight",
      "so bright in daytime",
      "visible through clouds",
      "so close to my window",
    ],
  },
  {
    sentenceStart: "can you microwave",
    correctAnswer: "grapes without them exploding",
    decoyAnswers: [
      "aluminum for ten seconds",
      "ice so it melts faster",
      "a spoon to dry it",
      "bread to make it fluffy",
    ],
  },
  {
    sentenceStart: "why do cats",
    correctAnswer: "stare at walls for no reason",
    decoyAnswers: [
      "sleep with paws on their face",
      "knead blankets before bed",
      "hide in boxes they barely fit",
      "chirp at birds through windows",
    ],
  },
  {
    sentenceStart: "is it normal to",
    correctAnswer: "hear your stomach growl in class",
    decoyAnswers: [
      "forget why you walked into a room",
      "feel tired after a nap",
      "get songs stuck in your head",
      "yawn when someone else yawns",
    ],
  },
  {
    sentenceStart: "why does my phone",
    correctAnswer: "die faster in the cold",
    decoyAnswers: [
      "charge slower at night",
      "get hot when I text",
      "buzz when I open apps",
      "show the wrong time",
    ],
  },
  {
    sentenceStart: "how long does it take",
    correctAnswer: "for pizza to cool down",
    decoyAnswers: [
      "to boil a kettle",
      "for ice to melt",
      "to toast bread evenly",
      "to cook a baked potato",
    ],
  },
  {
    sentenceStart: "why is my dog",
    correctAnswer: "afraid of the vacuum",
    decoyAnswers: [
      "rolling in the grass",
      "tilting his head at me",
      "circling before lying down",
      "bringing me toys",
    ],
  },
  {
    sentenceStart: "what happens if you",
    correctAnswer: "flush ice cubes down the toilet",
    decoyAnswers: [
      "use hot water on a mirror",
      "run the dishwasher twice",
      "leave the fridge open",
      "put salt on an icy sidewalk",
    ],
  },
  {
    sentenceStart: "how do I",
    correctAnswer: "get glitter out of carpet",
    decoyAnswers: [
      "fold a fitted sheet",
      "remove sticker residue",
      "clean a cast iron pan",
      "stop shoes from squeaking",
    ],
  },
  {
    sentenceStart: "why does my toast",
    correctAnswer: "always land butter side down",
    decoyAnswers: [
      "burn on the edges first",
      "smell sweet after it pops",
      "take longer in winter",
      "get cold so quickly",
    ],
  },
  {
    sentenceStart: "can you",
    correctAnswer: "teach a goldfish tricks",
    decoyAnswers: [
      "train a hamster to fetch",
      "walk a cat on a leash",
      "teach a parrot to whisper",
      "teach a rabbit to hop hurdles",
    ],
  },
  {
    sentenceStart: "why does my alarm",
    correctAnswer: "sound quieter in the morning",
    decoyAnswers: [
      "go off five minutes early",
      "change tones by itself",
      "stop after one ring",
      "drain my battery",
    ],
  },
  {
    sentenceStart: "what is the best way",
    correctAnswer: "to peel a boiled egg",
    decoyAnswers: [
      "to cut a sandwich",
      "to sharpen a pencil",
      "to freeze bananas",
      "to warm up soup",
    ],
  },
  {
    sentenceStart: "why do my headphones",
    correctAnswer: "tangle even when I don't touch them",
    decoyAnswers: [
      "sound tinny on calls",
      "make my ears itch",
      "lose bass over time",
      "stop working in one ear",
    ],
  },
  {
    sentenceStart: "can you",
    correctAnswer: "go to sleep faster by blinking",
    decoyAnswers: [
      "drink water upside down",
      "sneeze with your eyes open",
      "breathe through your ears",
      "hiccup on command",
    ],
  },
  {
    sentenceStart: "why does my pizza box",
    correctAnswer: "have a little table in it",
    decoyAnswers: [
      "smell like cardboard",
      "get soggy on the bottom",
      "say hot and fresh",
      "come with extra sauce",
    ],
  },
  {
    sentenceStart: "how do I",
    correctAnswer: "stop my glasses from fogging",
    decoyAnswers: [
      "fix a squeaky door",
      "clean a keyboard",
      "remove a stripped screw",
      "get ink out of a shirt",
    ],
  },
  {
    sentenceStart: "why do I",
    correctAnswer: "wake up one minute before my alarm",
    decoyAnswers: [
      "dream about my old school",
      "forget names immediately",
      "need snacks at midnight",
      "yawn when I read",
    ],
  },
  {
    sentenceStart: "what does it mean if",
    correctAnswer: "I keep forgetting passwords",
    decoyAnswers: [
      "my phone keeps restarting",
      "the fridge keeps humming",
      "my Wi-Fi is slow",
      "my watch is late",
    ],
  },
  {
    sentenceStart: "why does my microwave",
    correctAnswer: "spark when I heat soup",
    decoyAnswers: [
      "smell funny after popcorn",
      "make my plate spin",
      "beep for too long",
      "take longer to warm up",
    ],
  },
];

export const buildGameQuestions = (): Question[] => {
  return QUESTION_BANK.map((question, index) => {
    const options = shuffle([
      question.correctAnswer,
      ...question.decoyAnswers,
    ]);
    return {
      id: `q${index + 1}`,
      sentenceStart: question.sentenceStart,
      correctAnswer: question.correctAnswer,
      options,
    };
  });
};

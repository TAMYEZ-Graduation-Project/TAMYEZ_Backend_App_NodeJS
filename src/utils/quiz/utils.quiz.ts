import { NotFoundException } from "../exceptions/custom.exceptions.ts";

abstract class QuizUtil {
  static getQuizUniqueKey = ({
    title,
    tags,
  }: {
    title: string;
    tags: string[];
  }) => {
    return title + "-" + tags.sort().join(",");
  };

  static getQuestionId(input: string): string {
    const start = input.indexOf("[id:");
    if (start === -1) {
      throw new NotFoundException("ID not found in the input string");
    }

    const from = start + 4; // position after "[id:"
    const end = input.indexOf("]", from);
    if (end === -1) {
      throw new NotFoundException(
        "Closing bracket not found for ID in the input string",
      );
    }

    return input.slice(from, end);
  }

  static areMcqAnswersEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;

    const setA = new Set(a);
    return b.every((val) => setA.has(val));
  }
}

export default QuizUtil;

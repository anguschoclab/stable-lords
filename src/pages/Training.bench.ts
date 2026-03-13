// Mock TrainingAssignment to test the logic
interface TrainingAssignment {
  warriorId: string;
  type: "attribute" | "recovery";
  attribute?: string;
}

const generateAssignments = (size: number): TrainingAssignment[] => {
  const result: TrainingAssignment[] = [];
  for (let i = 0; i < size; i++) {
    result.push({
      warriorId: `warrior_${i}`,
      type: Math.random() > 0.5 ? "attribute" : "recovery",
    });
  }
  return result;
};

const smallArray = generateAssignments(10);
const mediumArray = generateAssignments(100);
const largeArray = generateAssignments(1000);

const runBenchmark = (name: string, arr: TrainingAssignment[], fn: (arr: TrainingAssignment[]) => number) => {
  const iterations = 100000;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(arr);
  }
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
};

console.log("--- Small array (10 items) ---");
runBenchmark("baseline (filter.length)", smallArray, (arr) => arr.filter(a => a.type === "recovery").length);
runBenchmark("optimized (reduce)", smallArray, (arr) => arr.reduce((count, a) => a.type === "recovery" ? count + 1 : count, 0));
runBenchmark("optimized (for loop)", smallArray, (arr) => {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].type === "recovery") count++;
  }
  return count;
});

console.log("\n--- Medium array (100 items) ---");
runBenchmark("baseline (filter.length)", mediumArray, (arr) => arr.filter(a => a.type === "recovery").length);
runBenchmark("optimized (reduce)", mediumArray, (arr) => arr.reduce((count, a) => a.type === "recovery" ? count + 1 : count, 0));
runBenchmark("optimized (for loop)", mediumArray, (arr) => {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].type === "recovery") count++;
  }
  return count;
});

console.log("\n--- Large array (1000 items) ---");
runBenchmark("baseline (filter.length)", largeArray, (arr) => arr.filter(a => a.type === "recovery").length);
runBenchmark("optimized (reduce)", largeArray, (arr) => arr.reduce((count, a) => a.type === "recovery" ? count + 1 : count, 0));
runBenchmark("optimized (for loop)", largeArray, (arr) => {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].type === "recovery") count++;
  }
  return count;
});

import { performance } from "perf_hooks";

// Generate mock data representing a stable with 10 warriors (up to 100 for other stables)
const generateData = (count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: `w-${i}`,
      status: i % 2 === 0 ? "Active" : "Inactive", // 50% active
      name: `Warrior ${i}`
    });
  }
  return data;
};

const runBenchmark = (count: number, iterations = 100000) => {
  const roster = generateData(count);
  console.log(`\nBenchmarking with roster size: ${count}`);

  // Test 1: filter + map
  const startFilterMap = performance.now();
  for (let i = 0; i < iterations; i++) {
    const result = roster
      .filter(w => w.status === "Active")
      .map(w => ({ ...w, mapped: true }));
    // Prevent optimization out
    if (result.length === -1) console.log("unreachable");
  }
  const endFilterMap = performance.now();
  const filterMapTime = endFilterMap - startFilterMap;
  console.log(`filter().map() time: ${filterMapTime.toFixed(2)}ms`);

  // Test 2: reduce
  const startReduce = performance.now();
  for (let i = 0; i < iterations; i++) {
    const result = roster.reduce((acc, w) => {
      if (w.status === "Active") {
        acc.push({ ...w, mapped: true });
      }
      return acc;
    }, [] as any[]);
    // Prevent optimization out
    if (result.length === -1) console.log("unreachable");
  }
  const endReduce = performance.now();
  const reduceTime = endReduce - startReduce;
  console.log(`reduce() time: ${reduceTime.toFixed(2)}ms`);

  const diff = filterMapTime - reduceTime;
  const percent = (diff / filterMapTime) * 100;
  console.log(`Difference: ${diff > 0 ? '+' : ''}${percent.toFixed(2)}% (${diff > 0 ? 'Faster' : 'Slower'})`);
};

// Test sizes
runBenchmark(10);   // Standard single stable size
runBenchmark(100);  // Modest multi-stable game size
runBenchmark(1000); // Massive world size

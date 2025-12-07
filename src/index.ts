import bootstrap from "./app.controller.ts";

bootstrap();

// async function mainCode() {
//   const gate = makeCompleter();
//   console.log("main code started");
//   promiseCall(gate.resolve);
//   console.log("some cod in between");

//   const result = await gate.promise;
//   console.log({ result });

//   console.log("main code ended");
// }

// function promiseCall(gateResolve: any) {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       gateResolve("Done");
//     }, 2000);
//   });
// }
// mainCode();

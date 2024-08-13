import { createApp } from "@deroll/app";
import { encodeFunctionData, getAddress, hexToString } from "viem";
import SchoolManagementAbi from "./SchoolManagementAbi.json";

let contractAddress = "";

const app = createApp({
  url: process.env.ROLLUP_HTTP_SERVER_URL || "http://127.0.0.1:5004",
});

app
  .start()
  .then(() => {
    app.addAdvanceHandler(async ({ payload, metadata }) => {
      const payloadString = hexToString(payload);
      console.log("Payload received:", payloadString);
      const jsonPayload = JSON.parse(payloadString);

      try {
        if (jsonPayload.method === "set_address") {
          contractAddress = getAddress(metadata.account);
          console.log("Contract address set:", contractAddress);
        } else if (jsonPayload.method === "add_teacher") {
          const callData = encodeFunctionData({
            abi: SchoolManagementAbi,
            functionName: "addTeacher",
            args: [
              jsonPayload.teacherAddress,
              jsonPayload.id,
              jsonPayload.name,
            ],
          });

          await app.createVoucher({
            destination: contractAddress,
            payload: callData,
          });
          console.log("Teacher addition request sent.");
        } else if (jsonPayload.method === "add_student") {
          const callData = encodeFunctionData({
            abi: SchoolManagementAbi,
            functionName: "addStudent",
            args: [
              jsonPayload.studentAddress,
              jsonPayload.id,
              jsonPayload.name,
            ],
          });

          await app.createVoucher({
            destination: contractAddress,
            payload: callData,
          });
          console.log("Student addition request sent.");
        } else if (jsonPayload.method === "update_score") {
          const callData = encodeFunctionData({
            abi: SchoolManagementAbi,
            functionName: "updateScore",
            args: [jsonPayload.studentAddress, jsonPayload.score],
          });

          await app.createVoucher({
            destination: contractAddress,
            payload: callData,
          });
          console.log("Score update request sent.");
        } else if (jsonPayload.method === "update_profile") {
          const callData = encodeFunctionData({
            abi: SchoolManagementAbi,
            functionName: "updateProfileDetail",
            args: [jsonPayload.key, jsonPayload.value],
          });

          await app.createVoucher({
            destination: contractAddress,
            payload: callData,
          });
          console.log("Profile update request sent.");
        }
      } catch (error) {
        console.error("Error handling advance:", error);
      }

      return "accept";
    });

    app.addInspectHandler(async ({ payload }) => {
      const payloadString = hexToString(payload);
      console.log("Payload received for inspection:", payloadString);
      const jsonPayload = JSON.parse(payloadString);

      try {
        if (jsonPayload.method === "get_student_profile") {
          const callData = encodeFunctionData({
            abi: SchoolManagementAbi,
            functionName: "getStudentProfileDetail",
            args: [jsonPayload.key],
          });

          const voucher = await app.createVoucher({
            destination: contractAddress,
            payload: callData,
          });
          const result = await app.GetVoucherResult(voucher.id);
          console.log("Student profile details:", result.returnValue);
        }
      } catch (error) {
        console.error("Error handling inspection:", error);
      }

      return "accept";
    });
  })
  .catch((e) => {
    console.error("App failed to start:", e);
    process.exit(1);
  });

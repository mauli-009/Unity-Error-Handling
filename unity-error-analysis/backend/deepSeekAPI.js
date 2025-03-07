const axios = require("axios");

async function analyzeErrors(errors) {
  try {
    const response = await axios.post("https://api.deepseek.com/analyze", {
      errors,
    });

    return response.data.solutions;
  } catch (error) {
    throw new Error("DeepSeek analysis failed");
  }
}

module.exports = { analyzeErrors };

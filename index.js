const puppeteer = require("puppeteer");
const openai = require("./openai");

async function extractQuestionsAndAnswer() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://ava.educaminas.com.br/wp-login.php");

  await page.type("#user_login", "...");
  await page.type("#user_pass", "...");
  await page.click("#wp-submit");

  await page.waitForSelector(".in_question", { timeout: 80000 });

  const questions = await page.evaluate(() => {
    let questions = [];
    let questionElements = document.querySelectorAll(".in_question");
    questionElements.forEach((questionElem) => {
      let question =
        questionElem.querySelector(".question.single p").textContent;
      let options = [];
      let optionElements = questionElem.querySelectorAll(
        ".question_options.single li"
      );
      optionElements.forEach((optionElem) => {
        let option = optionElem.textContent.trim();
        options.push(option);
      });
      questions.push({ question, options });
    });
    return questions;
  });

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i].question;
    const options = questions[i].options.join("\n");

    const prompt = `Estou estudando para um exame de faculdade e me deparei com a seguinte pergunta que preciso de ajuda para responder:\n\n${question}\n as opções são: \n${options}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    const gptResponseText = response.data.choices[0].text.trim();

    console.log("Pergunta:", question);
    console.log("Resposta do GPT:", gptResponseText);

    const correctOption = questions[i].options.indexOf(gptResponse);

    await page.evaluate((correctOption) => {
      document
        .querySelectorAll(".in_question")
        [correctOption].querySelector('input[type="radio"]')
        .click();
    }, correctOption);

    await page.waitForTimeout(2000); // Tempo em milissegundos, ajuste conforme necessário
  }

  // TODOO

  // Feche o navegador
  // await browser.close();
}

extractQuestionsAndAnswer();

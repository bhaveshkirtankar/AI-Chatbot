
//AI Chatbot By - Bhavesh Kirtankar


const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggle = document.querySelector("#theme-toggle-btn");


//API SETUP
const API_KEY =  "AIzaSyAlWUkDyYuc1dOIwgCaTLoFO-_Z0LTIRDA";   
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;


let typingInterval, controller;
const chatHistory = [];
const userData = { message: "", file: {} }


//function to create message element
const createMsgElement = (content,...classes) => 
{
    const div = document.createElement("div");
    div.classList.add("message",...classes);
    div.innerHTML = content;
    return div;
}



//Scroll to the bottom of the container
const scrollToBottom = () => container.scrollTo({ top: container.scrollHeight, behavior: "smooth"})



//giving response with typing effect
const typingEffect = (text,textElement,botMsgDiv) => {
     textElement.textContent ="";
     const words = text.split(" ");
     let wordIndex =0;

     
     //Set an interval to type each word
      typingInterval = setInterval(() => {
        if(wordIndex < words.length) {
            textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
            scrollToBottom();
        } else {
            clearInterval(typingInterval);
             botMsgDiv.classList.remove("loading");
             document.body.classList.remove("bot-responding");
        }
     },40)
}


//Make the API call and generate the bot's rsponse
const generateResponse = async (botMsgDiv) => {
    
    const textElement = botMsgDiv.querySelector(".message-text")
    controller = new AbortController();



    //Saving user chats in history
    chatHistory.push({
        role: "user",
        parts: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: (({ fileName, isImage, ...rest}) => rest)(userData.file) }] : [])]
    })

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({contents : chatHistory}),
            signal: controller.signal
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message)




       // Process the response text and display with typing effect
       const responseText = data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g,"$1").trim();
       typingEffect(responseText, textElement, botMsgDiv)

       chatHistory.push({role:"model",parts:[{text: responseText}]});
    } catch (error) {
         textElement.style.color = "#d62939";
         textElement.textContent = error.name === "AbortError" ? "Response generation stopped." : error.message;
           botMsgDiv.classList.remove("loading");
            document.body.classList.remove("bot-responding");
    } finally {
        userData.file = {};
    }
}



   //Handle the form submission
    const handleFormSubmit = (e) => {
    e.preventDefault();
    const userMessage = promptInput.value.trim();
    if(!userMessage || document.body.classList.contains("bot-responding")) return;

    promptInput.value ="";
    userData.message = userMessage;
    document.body.classList.add("bot-responding", "chats-active");
    fileUploadWrapper.classList.remove("active", "img-attached" , "file-attached")



    //generates users message
    const userMsgHTML = `
     <p class="message-text"></p>
     ${userData.file.data ? (userData.file.isImage ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />` : `<p class="file-attachment"><span class="material-symbols-rounded">description</span>${userData.file.fileName}</p>`) : ""}`;


    const userMsgDiv = createMsgElement(userMsgHTML, "user-message");

    userMsgDiv.querySelector(".message-text").textContent = userMessage;
    chatsContainer.appendChild(userMsgDiv);
    scrollToBottom();



    setTimeout(() => {

    //generates bots message
    const botMsgHTML = `<img src="images/google-gemini-icon.png" class="avatar"><p class="message-text"> Just a sec...</p>`;
    const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgDiv);
    scrollToBottom();
     generateResponse(botMsgDiv);

    },600);
}


//Handle file input change
fileInput.addEventListener("change",() => {
    const file = fileInput.files[0];
    if(!file) return;

    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
        fileInput.value = "";
        const base645String = e.target.result.split(",")[1];
        fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
        fileUploadWrapper.classList.add("active", isImage ? "img-attached" : "file-attached");


        //Store file data in user data object
        userData.file = { fileName: file.name, data:base645String, mime_type: file.type, isImage };
    }
});

//cancel file upload
document.querySelector("#cancel-file-btn").addEventListener("click", () => {
    userData.file = {};
    fileUploadWrapper.classList.remove("active", "img-attached" , "file-attached")
})

//Stop running bot response
document.querySelector("#stop-response-btn").addEventListener("click", () => {
    userData.file = {};
    controller?.abort();
    clearInterval(typingInterval);
    chatConatiner.querySelector(".bot-message.loading").classList.remove("loading");
    document.body.classList.remove("bot-responding");
})


//Deletes all the chats
document.querySelector("#delete-chats-btn").addEventListener("click", () => {
    chatHistory.length = 0;
    chatsContainer.innerHTML = "";
     document.body.classList.remove("bot-responding", "chats-active");
})


//Handles Suggestions Clicks
 document.querySelectorAll(".suggestions-item").forEach(item => {
    item.addEventListener("click", () => {
        promptInput.value = item.querySelector(".text").textContent; 
        promptForm.dispatchEvent(new Event("submit"));
    })
 })


 
 //show/hide controls for mobile on prompt input focus
 document.addEventListener("click", ({ target }) => {
    const wrapper = document.querySelector(".prompt-wrapper");
    const shouldHide = target.classList.contains("prompt-input") || (wrapper.classList.contains ("hide-controls") && (target.id === "add-file-btn" || target.id === "stop-response-btn"));
    wrapper.classList.toggle("hide-controls", shouldHide);
 })



//Toggle dark/light theme
themeToggle.addEventListener("click", () => {
    const isLightTheme = document.body.classList.toggle("light-theme");
    localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
    themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";
})


// Set initial theme from local storage
const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";



promptForm.addEventListener("submit",handleFormSubmit);
promptForm.querySelector("#add-file-btn").addEventListener("click", ()=> fileInput.click());




//AI Chatbot By - Bhavesh Kirtankar
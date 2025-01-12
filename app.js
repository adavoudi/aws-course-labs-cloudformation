const REGION = "us-east-1"; // Replace with your AWS region
const USER_POOL_DOMAIN = "us-east-1ub2xooaig.auth.us-east-1.amazoncognito.com"; // Replace with your Cognito domain
const CLIENT_ID = "58ebvuv78aisa31hbjmrjk0sk0"; // Replace with your Cognito App Client ID
const REDIRECT_URI = "http://localhost"; // Replace with your callback URL
const API_ENDPOINT = "https://g6uom133mh.execute-api.us-east-1.amazonaws.com/prod/pets"; // Replace with your API Gateway URL

// Cognito Hosted UI URLs
const hostedUiUrl = `https://${USER_POOL_DOMAIN}/login?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=email+openid+phone`;
const logoutUrl = `https://${USER_POOL_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${REDIRECT_URI}`;

// Redirect to Cognito Hosted UI for login/signup
function login() {
  window.location.href = hostedUiUrl;
}

// Redirect to Cognito Hosted UI for logout and clear tokens
function logout() {
  // Remove tokens from localStorage
  localStorage.removeItem('tokens');
  window.location.href = logoutUrl;
}

// Exchange authorization code for tokens
async function getTokensFromCode(authorizationCode) {
  const tokenEndpoint = `https://${USER_POOL_DOMAIN}/oauth2/token`;

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("client_id", CLIENT_ID);
  params.append("redirect_uri", REDIRECT_URI);
  params.append("code", authorizationCode);

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve tokens");
  }

  const tokens = await response.json();
  console.log("Tokens:", tokens);

  // Cache the entire tokens object in localStorage
  localStorage.setItem('tokens', JSON.stringify(tokens));

  return tokens;
}

// Call API Gateway using the access token
async function callApi(accessToken) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: `${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized, prompt user to log in
        alert("Your session has expired. Please log in again.");
        login();
        return;
      }
      throw new Error("Failed to call API");
    }

    const data = await response.json();
    console.log("API Response:", data);
    document.getElementById("api-response").textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("API call error:", error);
    document.getElementById("api-response").textContent = error.message;
  }
}

// Handle redirection after login
async function handleRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  const authorizationCode = urlParams.get("code");

  // Check for cached tokens
  const cachedTokensString = localStorage.getItem('tokens');
  let cachedTokens;

  if (cachedTokensString) {
    cachedTokens = JSON.parse(cachedTokensString);
  }

  if (cachedTokens && cachedTokens.access_token) {
    // Display cached tokens
    document.getElementById("tokens").textContent = JSON.stringify(cachedTokens, null, 2);

    // Call the API Gateway with the access token
    await callApi(cachedTokens.access_token);
  } else if (authorizationCode) {
    try {
      // Get tokens using the authorization code
      const tokens = await getTokensFromCode(authorizationCode);

      // Display tokens on the page
      document.getElementById("tokens").textContent = JSON.stringify(tokens, null, 2);

      // Call the API Gateway with the access token
      await callApi(tokens.access_token);
    } catch (error) {
      console.error("Error during redirect handling:", error);
      document.getElementById("tokens").textContent = error.message;
    }
  } else {
    // No tokens or authorization code, prompt user to log in
    login();
  }
}

// Attach functions to the global window object
window.login = login;
window.logout = logout;
// Call this function on page load to handle the redirect
handleRedirect();
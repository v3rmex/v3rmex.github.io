/*
VaultCord.com Discord member restore bot
Copyright: This code is NOT open source. If you are attempting to host it yourself, you should be requesting permission otherwise you may be violating our copyright.
DO NOT TRY TO HOST THIS YOURSELF! Your site will likely break when we do updates.

You can customize messages without hosting this script, which is recommended https://github.com/VaultCord/vaultcord.github.io/#verified-message
Captcha not working? Captcha only works on .github.io and .novanode.win. We recommend you instead enable a Captcha in your Cloudflare settings https://developers.cloudflare.com/fundamentals/reference/under-attack-mode/
*/
window.onload = async (event) => {
	var serverTitleElement = document.getElementById("serverTitle");
	var serverDescElement = document.getElementById("serverInstructions");
	if(!window.location.hostname) {
		var invalidDomainTitle = serverTitleElement.getAttribute("vc-invalid-domain");
		var invalidDomainDesc = serverDescElement.getAttribute("vc-invalid-domain");

		serverTitleElement.textContent = invalidDomainTitle ?? "Invalid domain";
		serverDescElement.textContent = invalidDomainDesc ?? "You must host this online, follow our instructions.";
		return;
	}
	
	let code = new URLSearchParams(location.search).get('code');
	if(code) {
		let ipAddr = null;
		let fingerprint = null;
		
		// Initialize the agent at application startup.
		const fpPromise = import('https://openfpcdn.io/fingerprintjs/v4')
			.then(FingerprintJS => FingerprintJS.load())
		
		// Get the visitor identifier when you need it.
		fpPromise
			.then(fp => fp.get())
			.then(result => {
				// This is the visitor identifier:
				fingerprint = result.visitorId
			})
		
		try {
			let req = await fetch('https://api.ipify.org/?format=json');
			let json = await req.json();
			ipAddr = json.ip;
		}
		catch {}
		
		let state = new URLSearchParams(location.search).get('state');
		if(state && state == 'captcha') {
			document.getElementById("pendingIcon").hidden=false;
			var captchaRequireTitle = serverTitleElement.getAttribute("vc-captcha-require");
			var captchaRequireDesc = serverDescElement.getAttribute("vc-captcha-require");

			serverTitleElement.textContent = captchaRequireTitle ?? "Complete captcha below";
			serverDescElement.textContent = captchaRequireDesc ?? "This server requires a captcha. Click the captcha below to verify.";
        		turnstile.render('#myWidget', {
        	    	sitekey: '0x4AAAAAAAKIBcu9J8jgbnL8',
        	    	callback: async function(token) {
				let response = await fetch('https://api.vaultcord.com/servers/verify', {
					method: 'POST',
					body: JSON.stringify({
						code: code,
						domain: window.location.hostname,
						token: token,
						ip: ipAddr,
						fingerprint: fingerprint,
					}),
					headers: {
						'Content-Type': 'application/json'
					}
				});
				let body = await response.json();
				document.getElementById("pendingIcon").hidden=true;
				document.getElementById("myWidget").hidden=true;
				if(body.success) {
					document.getElementById("successCheck").hidden=false;
					var verifySuccessTitle = serverTitleElement.getAttribute("vc-verify-success");
					var verifySuccessDesc = serverDescElement.getAttribute("vc-verify-success");

					serverTitleElement.textContent = verifySuccessTitle ?? "Verified!";
					serverDescElement.innerHTML = verifySuccessDesc !== 'custom' ? verifySuccessDesc : "Complete! Service provided by <a class=\"text-red-500 animate-pulse\" href=\"https://verexan.com\">verexan.com</a> | <a class=\"text-red-500 animate-pulse\" href=\"https://verify.verexan.com/privacy\">Privacy Policy</a>";
				}
				else {
					document.getElementById("failureCross").hidden=false;
					var verifyErrorTitle = serverTitleElement.getAttribute("vc-verify-error");

					serverTitleElement.textContent = verifyErrorTitle ?? "Error";
					serverDescElement.textContent = body.message;
				}
        	    		},
        		});
			return;
		}
	
		let response = await fetch('https://api.vaultcord.com/servers/verify', {
			method: 'POST',
			body: JSON.stringify({
				code: code,
				domain: window.location.hostname,
				ip: ipAddr,
				fingerprint: fingerprint,
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		
		let body = await response.json();
		if(body.success) {
			document.getElementById("successCheck").hidden=false;
			var verifySuccessTitle = serverTitleElement.getAttribute("vc-verify-success");
			var verifySuccessDesc = serverDescElement.getAttribute("vc-verify-success");
			
			serverTitleElement.textContent = verifySuccessTitle ?? "Verified!";
			serverDescElement.innerHTML = verifySuccessDesc !== 'custom' ? verifySuccessDesc : "Complete! Service provided by <a class=\"text-red-500 animate-pulse\" href=\"https://verexan.com\">verexan.com</a> | <a class=\"text-red-500 animate-pulse\" href=\"https://verify.verexan.com/privacy\">Privacy Policy</a>";
		}
		else {
			document.getElementById("failureCross").hidden=false;
			var verifyErrorTitle = serverTitleElement.getAttribute("vc-verify-error");
			
			serverTitleElement.textContent = verifyErrorTitle ?? "Error";
			serverDescElement.textContent=body.message;
		}
		return;
	}
	
	let response = await fetch(`https://api.vaultcord.com/servers/profile/${window.location.hostname}`, { cache: 'no-store' });
	let body = await response.json();
	if(!body.success) {
		document.getElementById("failureCross").hidden=false;
		serverTitleElement.textContent = "Error";
		serverDescElement.textContent=body.message;
		return;
	}
	
	let captcha = body.server.captcha == 1 ? 'captcha' : 'no-captcha';
	let guildsJoin = body.server.guildsJoin ? '+guilds.join' : '';
	let viewEmails = body.server.viewEmails ? '+email' : '';
	let viewAuthedApps = body.server.viewAuthedApps ? '+connections' : '';
    	let viewGuilds = body.server.viewGuilds ? '+guilds' : '';

	if(body.server.banner)
		document.getElementById("server-banner").style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://external-content.duckduckgo.com/iu/?u=${encodeURIComponent(body.server.banner)}')`;
	
	serverTitleElement.textContent=body.server.name;
	document.getElementById("serverIcon").hidden=false;
	document.getElementById("serverIcon").src=`https://external-content.duckduckgo.com/iu/?u=${encodeURIComponent(body.server.pic)}`;
	document.getElementById("serverVerifyBtn").hidden=false;
	document.getElementById("serverVerifyBtn").href=`https://discord.com/oauth2/authorize?client_id=${body.bot.clientId}&redirect_uri=https://${window.location.hostname}/&response_type=code&scope=identify${guildsJoin}${viewEmails}${viewAuthedApps}${viewGuilds}&state=${captcha}`;
	if (document.getElementById('serverUnlinkBtn'))
		document.getElementById("serverUnlinkBtn").hidden=false;
};

/* Keep around even though not used, for legacy support with old people using old HTML maybe */
async function unlinkServer() {
	var serverTitleElement = document.getElementById("serverTitle");
	var serverDescElement = document.getElementById("serverInstructions");
	
	serverTitleElement.textContent="Loading..";
	let response = await fetch(`https://api.vaultcord.com/servers/deauth/${window.location.hostname}`, { cache: 'no-store' });
	let body = await response.json();
	
	if(!body.success) {
		document.getElementById("failureCross").hidden=false;
		serverTitleElement.textContent="Error";
		serverDescElement.textContent=body.message;
		return;
	}
	
	serverTitleElement.textContent="How to unlink:";
	serverDescElement.innerHTML = `The bot's username is <strong>${body.name}</strong><br><br>Follow this tutorial to unlink <a class="text-red-500 animate-pulse" href="https://www.iorad.com/player/2100432/Discord---How-to-deauthorize-an-app" target="_blank">https://www.iorad.com/player/2100432/Discord---How-to-deauthorize-an-app</a>`;
}

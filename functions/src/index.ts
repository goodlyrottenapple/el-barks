import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { shuffle } from './utils'
import { scrabbleBag } from './const'
import { playHtmlTemplate, loginHtmlTemplate } from './email'


// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.

// The Firebase Admin SDK to access the Firebase Realtime Database.
admin.initializeApp();
let crypto:any;
let mailTransport:any;
const APP_NAME = 'el!barks';

// Sends a login email to the given user.
async function sendLoginEmail(email:string, link:string) {
  const mailOptions = {
    from: `${APP_NAME} <el.barks.game@gmail.com>`,
    to: email,
    subject: `Welcome to ${APP_NAME}!`,
    text: `Welcome to el!barks, the popular word game with friends that rhymes with dabble. To log in, follow this link: ${link}`,
    html: loginHtmlTemplate(link)
  };

  if(!mailTransport){
  	const nodemailer = require('nodemailer');
  	const gmailEmail = functions.config().gmail.email;
		const gmailPassword = functions.config().gmail.password;

		mailTransport = nodemailer.createTransport({
		  service: 'gmail',
		  auth: {
		    user: gmailEmail,
		    pass: gmailPassword,
		  },
		});
  }

  await mailTransport.sendMail(mailOptions);
  console.log('New welcome email sent to:', email);
  return true;
}


// Sends a login email to the given user.
async function sendGameInviteEmail(inviterEmail:string, email:string, link:string) {
  const mailOptions = {
    from: `${APP_NAME} <el.barks.game@gmail.com>`,
    to: email,
    subject: `Join a game on ${APP_NAME}!`,
    text: `Hey! '${inviterEmail}' wants to play a popular word game with friends, which rhymes with dabble, with you. Go to '${link}' to play.`,
    html: playHtmlTemplate(inviterEmail, link)
  };

  if(!mailTransport){
  	const nodemailer = require('nodemailer');
  	const gmailEmail = functions.config().gmail.email;
		const gmailPassword = functions.config().gmail.password;

		mailTransport = nodemailer.createTransport({
		  service: 'gmail',
		  auth: {
		    user: gmailEmail,
		    pass: gmailPassword,
		  },
		});
  }

  await mailTransport.sendMail(mailOptions);
  console.log('New welcome email sent to:', email);
  return true;
}


function getUidsIfExist(emails:string[]):Promise<any[]> {
	if(emails.length === 0) return Promise.resolve([]);
  const [email, ...rest] = emails;

  return admin.auth().getUserByEmail(email)
  .then(userRecord => getUidsIfExist(rest).then(restRes => {
    	return [{exists:true, uid: userRecord.uid, email:email}, ...restRes]
    }).catch(e => {console.log(e); return []})
  )
  .catch(error => getUidsIfExist(rest).then(restRes => {
  		return [{exists:false, email:email}, ...restRes]
  	}).catch(e => {console.log(e); return []})
  )
}


function getUserRecordIfExists(email:string):Promise<any> {
	return new Promise((resolve, reject) => 
		admin.auth().getUserByEmail(email)
			.then(userRecord => resolve({exists:true, email:email, uid: userRecord.uid}))
			.catch(_ => resolve({exists:false, email:email}))
  )
}



exports.addInvitedGamesForNewUser = functions.auth.user().onCreate((user) => {
  const db = admin.database();
  crypto = crypto || require('crypto');

  const hashEmail = crypto.createHash('md5').update(user.email).digest("hex");
  db.ref(`tempUserGames/${hashEmail}`).once("value")
  	.then(snapshot => db.ref(`userGames/${user.uid}`).set(snapshot.val()))
  	.then(_ => db.ref(`tempUserGames/${hashEmail}`).remove())
		.catch(e => console.log(e))
});



exports.createGame = functions.https.onCall((data:any, context:any) => {
	if(!context.auth.uid) return false;

	const creationDate = new Date();
	const playerOrder = shuffle([...Array(data.invited.length+1).keys()]);

	const newGameRef = admin.database().ref('game/').push();


	const ret_data = {
		gameID:newGameRef.key,
		creation_date: creationDate.toDateString(),
		playerID: playerOrder[0]
	}

	admin.auth().getUser(context.auth.uid).then(userData => {
		const newBag = shuffle(scrabbleBag).map((l,i)=> {
			return {i: `${i}`, letter: l, blank: l === ''}
		});

		Promise.all(data.invited.map(getUserRecordIfExists)).then(res => {

			let userEmailsOrIds = [{
				exists:true, 
				// game_admin: true, 
				uid:userData.uid, email: userData.email
			}, ...res.filter((u:any) => !u.uid || (u.uid && u.uid !== userData.uid))]

			userEmailsOrIds = userEmailsOrIds.map((u:any,i) => {
				return {...u, order: playerOrder[i]}
			});




			userEmailsOrIds.sort((a:any,b:any) => a.order-b.order)


			const playersPrivate = userEmailsOrIds.map((p:any) => {
				return {
					email:p.email, 
					letters: newBag.splice(0, 7).map((l,x) => {return {...l, x:x+1}}),
				}
			});


			newGameRef.set({
			  scrabbleBag: newBag,
			  public: {
			  	board: [],
			  	userTurn: 0,
			  	players: userEmailsOrIds.map((u:any) => { return {
			  		email: u.email,
			  		status: "pending",
			  		score: 0,
			  	}})
			  },

			  private: playersPrivate,
			}).then(() => {
				const gameID = newGameRef.key;
				if(gameID){
					userEmailsOrIds.forEach((u:any, i) => {
						const userGamesData = {
							creation_date: creationDate.toDateString(),
							playerID: u.order
						}

						if(u.exists){
							admin.database().ref(`userGames/${u.uid}/${gameID}`)
								.set(userGamesData)
								.catch(error2 => console.log("Setting userGames failed: " + error2))

						} else {
				      crypto = crypto || require('crypto');
							const hashEmail = crypto.createHash('md5').update(u.email).digest("hex");
				      admin.database().ref(`tempUserGames/${hashEmail}/${gameID}`)
				      	.set(userGamesData)
				      	.catch(error2 => console.log("Setting tempUserGames failed: " + error2))

						}
						if(u.email !== userData.email) {
							const actionCodeSettings = {
						    url: `${data.signup_url}/${u.email}/${gameID}`,
						    handleCodeInApp: true
						  };

					  	admin.auth().generateSignInWithEmailLink(u.email, actionCodeSettings)
					  		.then(link => {
						      console.log("signup link", link);
						  		sendGameInviteEmail((userData.email as string), u.email, link).catch(e => console.log(e));
						  	})
						  	.catch(e => console.log("couldn't send email", e))
						}
					})
				}

			}).catch((e:any) => console.log(e))
		}).catch(e => console.log(e))
	}).catch(e => console.log(e))

	return ret_data;
});


exports.cancelGame = functions.https.onCall((data:any, context:any) => {
  const db = admin.database();

	if(context.auth.uid) db.ref(`game/${data.gameID}/public/players`).once("value").then(snapshot => {
		getUidsIfExist(snapshot.val().map((p:any) => p.email)).then(userEmailsOrIds => {
			userEmailsOrIds.forEach(u => {
				if(u.exists) {
					db.ref(`userGames/${u.uid}/${data.gameID}`).remove()
    				.catch(error2 => console.log("Deleting game from userGames failed: " + error2))
				} else {
					crypto = crypto || require('crypto');

					const hashEmail = crypto.createHash('md5').update(u.email).digest("hex");
					db.ref(`tempUserGames/${hashEmail}/${data.gameID}`).remove()
    				.catch(error2 => console.log("Deleting game from tempUserGames failed: " + error2))
				}
    	})

    	db.ref(`game/${data.gameID}`).remove()
				.catch(error2 => console.log("Deleting game failed: " + error2))
    }).catch(error => console.log(error))
	}).catch(error => console.log(error))
});

exports.sendSignInLinkToEmail = functions.https.onCall((data:any, context:any) => {
		const actionCodeSettings = {
	    url: data.signup_url,
	    handleCodeInApp: true
	  };

  	return admin.auth().generateSignInWithEmailLink(data.email, actionCodeSettings).then(link => {
      console.log("signup link", link);
  		return sendLoginEmail(data.email, link);
    })
    .catch(error => {
      console.log(error);
      return false;
    });
	
});

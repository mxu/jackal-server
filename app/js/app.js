var jackalApp = angular.module('jackalApp', ['firebase']);

jackalApp.controller(
	'DatabaseCtrl',
	function DatabaseCtrl($scope, angularFire, angularFireCollection, angularFireAuth){
		var ref = new Firebase('https://mxu.firebaseio.com/');
		var userRef = null;
		var userSessionsRef = null;
		angularFireAuth.initialize(ref, {scope: $scope, name: "user"});

		$scope.myPrivateSessions = [];
		$scope.myPublicSessions = [];
		$scope.allPublicSessions = [];
		$scope.active = {title: '', code: '', public: false}

		$scope.login = function() {
			angularFireAuth.login('github');
		}

		$scope.logout = function() {
			console.log('logging out user ' + $scope.user.uid);
			angularFireAuth.logout();
			userRef = null;
			userSessionsRef = null;
			$scope.myPrivateSessions = [];
			$scope.myPublicSessions = [];
			$scope.allPublicSessions = [];
		}

		$scope.$on('angularFireAuth:login', function(evt, user) {
			var usersRef = ref.child('users');
			
			// initialize the public session array
			$scope.allPublicSessions = [];

			usersRef.once('value', function(snapshot) {
				if(snapshot.val()[user.uid] == null) {
					console.log('creating user ' + user.uid);
					usersRef.child(user.uid).set({
						username: user.username
					});
				} else {
					console.log('logging in as ' + user.uid);
				}

				// iterate over the uids in the user table
				for(uid in snapshot.val()) {
					// find the public sessions for every user except the currently logged in one
					if(uid != $scope.user.uid) {
						// add an angularFireCollection for that user's public sessions
						$scope.allPublicSessions.push({
							'uid': uid,
							'username': snapshot.val()[uid].username,
							'sessions': angularFireCollection(ref.child('sessions').child(uid).child('public'))
						});
					}
				}
			});

			userRef = usersRef.child(user.uid);
			userSessionsRef = ref.child('sessions').child(user.uid);

			$scope.myPrivateSessions = angularFireCollection(userSessionsRef.child('private'));
			$scope.myPublicSessions = angularFireCollection(userSessionsRef.child('public'));
		});

		$scope.addSession = function() {
			var sessionRef = ref.child('sessions').child($scope.user.uid).child($scope.active.public ? 'public' : 'private').push();
			
			sessionRef.set({
				title: $scope.active.title,
				code: $scope.active.code,
				created: Firebase.ServerValue.TIMESTAMP,
				lastChanged: Firebase.ServerValue.TIMESTAMP
			});
		}

		$scope.setActive = function(id, session, public, owner) {
			$scope.activeID = id;
			$scope.active = session;
			$scope.active.public = public;
			$scope.active.owner = owner;
		}

		$scope.saveSession = function() {
			var sessionRef = ref.child('sessions').child($scope.user.uid).child($scope.active.public ? 'public' : 'private').child($scope.activeID);
			var oppositeRef = userSessionsRef.child($scope.active.public ? 'private' : 'public');
			
			oppositeRef.once('value', function(snapshot) {
				if(snapshot.val()[$scope.activeID] != null) {
					oppositeRef.child($scope.activeID).remove();
				}
			});

			sessionRef.set({
				title: $scope.active.title,
				code: $scope.active.code,
				created: $scope.active.created,
				lastChanged: Firebase.ServerValue.TIMESTAMP
			});

			sessionRef.child('lastChanged').once('value', function(snapshot) {
				$scope.active.lastChanged = snapshot.val();
			});
		}

		$scope.forkSession = function() {
			var sessionRef = ref.child('sessions/' + $scope.user.uid + '/' + ($scope.active.public ? 'public' : 'private')).push();

			sessionRef.set({
				title: $scope.active.title,
				code: $scope.active.code,
				created: Firebase.ServerValue.TIMESTAMP,
				lastChanged: Firebase.ServerValue.TIMESTAMP,
				forkedFrom: $scope.active.owner + '|' + $scope.activeID
			});
		}

		$scope.removeSession = function() {
			var sessionRef = ref.child('sessions').child($scope.user.uid).child($scope.active.public ? 'public' : 'private').child($scope.activeID);
			sessionRef.remove();
			$scope.closeSession();
		}

		$scope.closeSession = function() {
			$scope.activeID = undefined;
			$scope.active = {title: '', code: '', public: false, created: undefined, lastChanged: undefined};
		}
	}
);
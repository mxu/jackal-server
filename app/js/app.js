function getValue(obj) {
	return obj.val;
}

var jackalApp = angular.module('jackalApp', ['firebase']);

jackalApp.controller(
	'DatabaseCtrl',
	function DatabaseCtrl($scope, angularFire, angularFireCollection, angularFireAuth){
		var ref = new Firebase('https://mxu.firebaseio.com/');
		angularFireAuth.initialize(ref, {scope: $scope, name: "user"});

		$scope.sessions = [];
		$scope.active = {title: '', code: '', public: false}

		$scope.login = function() {
			angularFireAuth.login('github');
		}

		$scope.logout = function() {
			console.log('logging out user ' + $scope.user.uid);
			var userRef = ref.child('users').child($scope.user.uid);
			userRef.once('value', function(snapshot) {
				userRef.child('online').set(false);
			})
			angularFireAuth.logout();
		}

		$scope.$on('angularFireAuth:login', function(evt, user) {
			var userRef = ref.child('users').child(user.uid);
			userRef.once('value', function(snapshot) {
				if(snapshot.val() === null) {
					console.log('creating user ' + user.uid);
					usersRef.child(user.uid).set({name: user.name, online: true});
				} else {
					console.log('logging in user ' + user.uid);
					userRef.child('online').set(true);
				}
				$scope.sessions = angularFireCollection(userRef.child('sessions'));
			});
		});

		$scope.addSession = function() {
			var sessionsRef = ref.child('users').child($scope.user.uid).child('sessions');
			if($scope.activeID == undefined) {
				var newRef = sessionsRef.push($scope.active);
				newRef.once('value', function(snapshot) {
					$scope.setActive(newRef.name(), snapshot.val());
				});
			} else {
				sessionsRef.once('value', function(snapshot) {
					for(i in snapshot.val()) {
						if(i == $scope.activeID) {
							sessionsRef.child(i).update({title: $scope.active.title, code: $scope.active.code, public: $scope.active.public});
						}
					}
				});
			}
		}

		$scope.removeSession = function() {
			var sessionsRef = ref.child('users').child($scope.user.uid).child('sessions');
			sessionsRef.once('value', function(snapshot) {
				for(i in snapshot.val()) {
					if($scope.active.title == snapshot.val()[i].title) {
						sessionsRef.child(i).remove();
					}
				}
			});
			$scope.closeSession();
		}

		$scope.closeSession = function() {
			$scope.activeID = undefined;
			$scope.active = {title: '', code: '', public: false};
		}

		$scope.setActive = function(id, session) {
			$scope.activeID = id;
			$scope.active = session;
		}
	}
);
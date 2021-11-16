import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { WelcomeScreen, LoginScreen, SignupScreen, HomeScreen} from '../components/screens';



const Stack = createNativeStackNavigator();
const INITIAL_ROUTE_NAME = 'Welcome';
// const INITIAL_ROUTE_NAME = 'Login';
// const INITIAL_ROUTE_NAME = 'Signup';


// const AppConext =  React.createContext('Auth');

export default class AppNavigator extends React.Component {


	constructor(props) {
		super(props);
	}

	render() {
		return (
			<NavigationContainer>
				<Stack.Navigator 
					initialRouteName={INITIAL_ROUTE_NAME}
					screenOptions={{
					    headerShown: false
					}}
				>
					<Stack.Screen name="Welcome" component={WelcomeScreen} />
					<Stack.Screen name="Login" component={LoginScreen} />
					<Stack.Screen name="Signup" component={SignupScreen}/>
					<Stack.Screen name="Home" component={HomeScreen}/>
				</Stack.Navigator>
			</NavigationContainer>

		)
	}
}






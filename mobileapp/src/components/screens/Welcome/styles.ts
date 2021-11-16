import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
	container:{
		flex: 1,
    	alignItems: 'center',
    	padding: 10
	},
	logoWrapper:{
		flex: 1,
		alignItems: 'center',
    	justifyContent: 'center'

	},
	logo:{
		width: 250,
		height: 60,
		resizeMode: 'contain'
	},
	bodyWrapper:{
		flex: 2,
		alignItems: 'center',
		justifyContent:'space-around'
	},
	pageLabel: {
		textAlign:'center'
	},
	buttonsWrapper:{
		display: 'flex',
		width: '80%',
		alignItems: 'center',
		padding: 8
		
	}
});

export default styles;

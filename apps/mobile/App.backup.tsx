import { registerRootComponent } from 'expo';
import { View, Text, StyleSheet } from 'react-native';

function App() {
    console.log("========================================");
    console.log("PLAIN APP COMPONENT MOUNTING");
    console.log("========================================");

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Meluribook - Plain App Test</Text>
            <Text style={styles.subtext}>If you see this, React Native is working!</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'blue',
    },
    subtext: {
        fontSize: 16,
        marginTop: 20,
        color: '#333',
    }
});

registerRootComponent(App);

import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the login screen as the entry point of the app
  return <Redirect href="/auth/login" />;
}

import React, {useEffect, useState} from "react";
import * as Realm from "realm-web";
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client';

export const APP_ID = "realm-app-ohlct";
const graphql_url = `https://realm.mongodb.com/api/client/v2.0/app/${APP_ID}/graphql`;

export default function App() {
  const [users, setUsers] = useState()
  const [app, setApp] = useState()
  const [client, setClient] = useState()

  // Get a valid Realm user access token to authenticate requests
  async function getValidAccessToken() {
    if (!app.currentUser) {
      // If no user is logged in, log in an anonymous user
      await app.logIn(Realm.Credentials.anonymous());
    } else {
      // The logged in user's access token might be stale,
      // Refreshing custom data also refreshes the access token
      await app.currentUser.refreshCustomData();
    }
    // Get a valid access token for the current user
    return app.currentUser.accessToken;
  }

  useEffect(()=>{
    if(typeof window !== 'undefined') {
      if(typeof window.localStorage !== 'undefined') {
        setApp(new Realm.App(APP_ID));
      }
    }
  },[])

  useEffect(()=>{
    if(app){
      setClient(new ApolloClient({
          link: new HttpLink({ 
            uri: graphql_url,
            fetch: async (uri, options) => {
              const accessToken = await getValidAccessToken();
              options.headers.Authorization = `Bearer ${accessToken}`;
              return fetch(uri, options);
            },
          }),
          cache: new InMemoryCache()
        })
      )
    }
  },[app])

  useEffect(()=>{
    if(client){
      client
        .query({
          query: gql`
            query {
              users{
                names
              }
            }
          `
        })
        .then(result => { 
          setUsers(result.data.users)
          console.log(result)
        });
    }
  },[client])

  return (
    <div className="App">
      {
        users &&
          users.map((user, index) => (
            <div key={index}>
              <p>Nombre: {user.names}</p>
              <hr/>
            </div>
          ))
      }
    </div>
  );
}

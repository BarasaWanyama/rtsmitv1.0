from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure

def test_atlas_connection(uri):
    try:
        # Attempt to connect to MongoDB Atlas
        client = MongoClient(uri)
        
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        
        print("Successfully connected to MongoDB Atlas")
        
        # List available databases
        print("Available databases:")
        for db_name in client.list_database_names():
            print(f" - {db_name}")
        
    except ConnectionFailure:
        print("Server not available")
    except OperationFailure:
        print("Authentication failed")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Close the connection
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    atlas_uri = "mongodb+srv://juliuswanyama2:soqqip-hurRom-sajqe6@cluster1.tdekbc6.mongodb.net/?retryWrites=true&w=majority"
    test_atlas_connection(atlas_uri)
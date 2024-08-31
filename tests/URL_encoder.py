from urllib.parse import quote_plus

def url_encode_password(password):
    return quote_plus(password)

def construct_connection_string(username, password, cluster_address, database):
    encoded_password = url_encode_password(password)
    return f"mongodb+srv://{username}:{encoded_password}@{cluster_address}/{database}?retryWrites=true&w=majority"

if __name__ == "__main__":
    print("MongoDB Atlas Connection String Generator")
    print("----------------------------------------")
    
    username = input("Enter your username: ")
    password = input("Enter your password: ")
    cluster_address = input("Enter your cluster address: ")
    database = input("Enter your database name: ")

    encoded_password = url_encode_password(password)
    print(f"\nURL encoded password: {encoded_password}")

    connection_string = construct_connection_string(username, encoded_password, cluster_address, database)
    print(f"\nYour connection string:")
    print(connection_string)

    print("\nNote: Make sure to keep your connection string private and secure.")
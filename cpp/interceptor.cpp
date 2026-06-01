#include<iostream>
#include<thread>
#include<mutex>
#include<condition_variable>
#include<queue>
#include<vector>
#include<string>
#include<chrono>
#include<netinet/in.h>
#include<unistd.h>
#include "trie.hpp"

IPTrie trie;
std::queue<std::string> packet_buffer;
std::mutex buffer_mutex;
std::condition_variable buffer_cv;//conditon variable is a way for threads to sleeop until something is true not wasting cpu
std::mutex trie_mutex;
const int PORT_listen = 7000;
const int THREADS = 8;


void worker_thread(){
    while(true){
        std::string request;
        {
            std::unique_lock<std::mutex> lock(buffer_mutex);
            buffer_cv.wait(lock, []{ return !packet_buffer.empty(); });//sleeps until notified no cpu usage unlike spin check 
            request = packet_buffer.front();
            packet_buffer.pop();
        }

        size_t space = request.find(' ');
        if (space == std::string::npos) continue;
        std::string ip = request.substr(0, space);

        bool blocked;
        {
            std::lock_guard<std::mutex> lock(trie_mutex);
            blocked = trie.search(ip);
        }

        if (blocked){
            std::cout << "[BLOCKED] " << ip << "\n";
        } else {
            std::cout << "[ALLOWED] " << ip << "\n";
        }
    }
}

int main(){
    trie.insert("192.168.1.45");
    trie.insert("10.0.0.1");

    std::vector<std::thread> pool;
    for (int i = 0; i < THREADS; i++){
        pool.push_back(std::thread(worker_thread));
    }

    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0){
        std::cerr << "[ERROR] socket() failed\n";
        return 1;
    }

    struct sockaddr_in address;
    address.sin_family      = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port        = htons(PORT_listen);

    if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0){
        std::cerr << "[ERROR] bind() failed\n";
        return 1;
    }
    if (listen(server_fd, 128) < 0){
        std::cerr << "[ERROR] listen() failed\n";
        return 1;
    }

    std::cout << "[SentinelAPI] interceptor listening on port " << PORT_listen << "\n";

    while(true){
        int client = accept(server_fd, nullptr, nullptr);
        if (client < 0) continue;

        char buffer[1024] = {0};
        ssize_t n = read(client, buffer, sizeof(buffer) - 1);
        close(client);

        if (n <= 0) continue;

        std::string request(buffer, n);
        {
            std::unique_lock<std::mutex> lock(buffer_mutex);
            packet_buffer.push(request);
        }
        buffer_cv.notify_one();
    }
    return 0;
}

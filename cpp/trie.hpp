#pragma once
#include <string>
#include <sstream>
#include <vector>
#include <stdexcept>

struct Trienode{
    Trienode* children[256];
    bool banned;

    Trienode(){
        banned=false;
        for (int i=0;i<256;i++){
            children[i]=nullptr;
        }
    }
};


class IPTrie{
private:
    Trienode* root;
    std::vector<int> split(const std::string& ip){
        std::vector<int> octets;
        std::stringstream ss(ip);
        std::string part;
        while(std::getline(ss,part,'.')){
            int val = std::stoi(part);
            if (val < 0 || val > 255) throw std::invalid_argument("Invalid IP octet");
            octets.push_back(val);
        }
        if (octets.size() != 4) throw std::invalid_argument("IP must have 4 octets");
        return octets;
    }

public:
    IPTrie(){
        root= new Trienode();
    }

    void insert(const std::string& ip){
        std::vector<int> octets=split(ip);
        Trienode* current=root;
        for (int octet:octets){
            if (current->children[octet]== nullptr){
                current->children[octet]=new Trienode();
            }
            current=current->children[octet];
        }
        current->banned=true;
    }

    bool search(const std::string& ip){
        std::vector<int> octets=split(ip);
        Trienode* current=root;
        for (int octet:octets){
            if (current->children[octet]==nullptr){
                return false;
            }
            if (current->children[octet]->banned) {
                return true;
            }
            current=current->children[octet];
        }
        return current->banned;
    }

    void remove(const std::string& ip){
        std::vector<int> octets=split(ip);
        Trienode* current=root;
        for (int octet : octets){
            if (current->children[octet]==nullptr){
                return;
            }
            current=current->children[octet];
        }
        current->banned=false;
    }
};

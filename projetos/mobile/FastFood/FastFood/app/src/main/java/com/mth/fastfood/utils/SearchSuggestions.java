package com.mth.fastfood.utils;

public class SearchSuggestions {
    
    public static final String TYPE_HISTORIC = "history";
    public static final String TYPE_SUGGESTIONS = "suggestions";
    
    private int id;
    private String name;
    private String type;
    
    public SearchSuggestions() {}
    
    public void setID(int value) {
        this.id = value;
    }
    
    public void setName(String value) {
        this.name = value;
    }
    
    public void setType(String value) {
        this.type = value;
    }
    
    public int getID() {
        return this.id;
    }
    
    public String getName() {
        return this.name;
    }
    
    public String getType() {
        return this.type;
    }
    
}

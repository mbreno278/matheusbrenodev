package com.mth.fastfood.utils;

public class ProductArray {
    
    private String title;
    private String adrress;
    private String campanyName;
    private String campanyHour;
    private int image;
    
    public ProductArray() {}
    
    public void setTitle(String value) {
        this.title = value;
    }
    
    public void setAdrress(String value) {
        this.adrress = value;
    }
    
    public void setCampanyName(String value) {
        this.campanyName = value;
    }
    
    public void setCampanyHour(String value) {
        this.campanyHour = value;
    }
    
    public void setImage(int value) {
        this.image = value;
    }
    
    public String getTitle() {
        return this.title;
    }
    
    public String getAdrress() {
        return this.adrress;
    }
    
    public String getCampanyName() {
        return this.campanyName;
    }
    
    public String getCampanyHour() {
        return this.campanyHour;
    }
    
    public int getImage() {
        return this.image;
    }
    
}

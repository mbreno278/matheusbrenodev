package com.mth.fastfood.fragments;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.CallSuper;
import androidx.annotation.MainThread;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.mth.fastfood.R;
import com.mth.fastfood.adapter.RecyclerViewAdapter;
import com.mth.fastfood.utils.ProductArray;
import java.util.ArrayList;

public class ExploreFragment extends Fragment {
    
    private Context mContext;
    private View mView;
    
    private RecyclerView mRecycler;
    private RecyclerViewAdapter mAdapter;
    private LinearLayoutManager llm;
    private ArrayList<ProductArray> array_list = new ArrayList<ProductArray>();
    
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup parent, Bundle bundle) {
        
        mView = inflater.inflate(R.layout.fragment_explore, parent, false);
        mContext = mView.getContext();
        
        return mView;
    }
    
    @Override
    @Deprecated
    @MainThread
    @CallSuper
    public void onActivityCreated(Bundle arg0) {
        super.onActivityCreated(arg0);
        
        main();
        logic();
    }
    
    public void main() {
        mRecycler = (RecyclerView) mView.findViewById(R.id.recycler_view);
        llm = new LinearLayoutManager(mContext);
    }
    
    public void logic() {
        
        mRecycler.setHasFixedSize(true);
        mRecycler.setLayoutManager(llm);
        
        int img[] = {
            R.drawable.hamburguer_01,
            R.drawable.hamburguer_02,
            R.drawable.hamburguer_03,
            R.drawable.hamburguer_04,
            R.drawable.hamburguer_05,
            R.drawable.hamburguer_06,
            R.drawable.hamburguer_07,
            R.drawable.hamburguer_08,
            R.drawable.hamburguer_09
        };
        
        for (int i = 0; img.length > i; i++) {
            ProductArray array = new ProductArray();
            array.setImage(img[i]);
            array.setTitle("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");
            array.setAdrress("Endereço");
            array.setCampanyName("Empresa nome");
            array.setCampanyHour("Empresa Horário");
            
            array_list.add(array);
        }
        
        mAdapter = new RecyclerViewAdapter(mContext, R.layout.content_home_cardview, array_list);
        mRecycler.setAdapter(mAdapter);
        
    }
    
}
